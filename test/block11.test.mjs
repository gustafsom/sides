import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, setMeta } from '../src/db.mjs';
import { createSidesServer } from '../src/server.mjs';
import {
  BACKUP_POLICY, EXPORT_SCHEMA_VERSION, EXPORT_TABLES, INTEGRITY_SCHEMA_VERSION,
  cleanupLogs, createDatabaseBackup, dataPaths, ensureAutomaticBackup, exportFullData,
  importJsonBackup, integrityStatus, listBackups, runIntegrityCheck, stageRestoreBuffer,
  validateDatabaseFile, validateExportPayload, writeLocalLog
} from '../src/integrity.mjs';

const NOW=new Date('2026-08-28T20:00:00Z');
function temp(){return mkdtempSync(join(tmpdir(),'sides-b11-'));}

async function listen(server){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});return `http://127.0.0.1:${server.address().port}`;}

async function closeServer(server){await new Promise(resolve=>server.close(resolve));}

test('V10 adds integrity state without losing previous subsystem schemas',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='integritySchemaVersion'").get().value,INTEGRITY_SCHEMA_VERSION);
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='maintenance_state'").get());
  for(const table of ['curriculum_meta','jw_assignments','speech_attempts','writing_attempts','immersion_sessions','study_goals'])assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table));
  db.close();
});

test('live integrity check validates quick_check and foreign keys',()=>{
  const db=openDatabase(':memory:');
  const result=runIntegrityCheck(db,NOW);
  assert.equal(result.ok,true);assert.equal(result.quickCheck,true);assert.equal(result.foreignKeyViolations,0);assert.equal(result.schemaVersion,'SIDES-DB-V10');
  db.close();
});

test('manual SQLite backup is verified and rotation is bounded',async()=>{
  const dir=temp(),path=join(dir,'sides.sqlite');const db=openDatabase(path);
  try{
    setMeta(db,'placementLevel','B2');
    const one=await createDatabaseBackup(db,{kind:'manual',now:NOW,policy:{...BACKUP_POLICY,manual:2}});
    assert.equal(one.ok,true);assert.equal(one.quickCheck,true);assert.match(one.sha256,/^[a-f0-9]{64}$/);
    const firstPath=join(dataPaths(db).backupDir,one.filename);
    assert.equal(validateDatabaseFile(firstPath).ok,true);
    await createDatabaseBackup(db,{kind:'manual',now:new Date(NOW.getTime()+1000),policy:{...BACKUP_POLICY,manual:2}});
    await createDatabaseBackup(db,{kind:'manual',now:new Date(NOW.getTime()+2000),policy:{...BACKUP_POLICY,manual:2}});
    assert.equal(listBackups(db).filter(x=>x.kind==='manual').length,2);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});

test('automatic backup skips creation while a verified backup is fresh',async()=>{
  const dir=temp(),db=openDatabase(join(dir,'sides.sqlite'));
  try{
    const first=await ensureAutomaticBackup(db,new Date());assert.equal(first.ok,true);assert.equal(first.skipped,undefined);
    const count=listBackups(db).filter(x=>x.kind==='auto').length;
    const second=await ensureAutomaticBackup(db,new Date(Date.now()+60_000));
    assert.equal(second.skipped,true);assert.equal(second.reason,'AUTO_BACKUP_FRESH');assert.equal(listBackups(db).filter(x=>x.kind==='auto').length,count);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});

test('JSON V9 export is complete and manifest matches every application table',()=>{
  const db=openDatabase(':memory:');
  const payload=exportFullData(db,NOW);
  assert.equal(payload.schemaVersion,EXPORT_SCHEMA_VERSION);assert.equal(payload.appSchemaVersion,'SIDES-DB-V10');assert.equal(payload.format,'SIDES-JSON-BACKUP-V1');
  for(const table of EXPORT_TABLES){assert.ok(Array.isArray(payload.tables[table]),table);assert.equal(payload.manifest[table],payload.tables[table].length,table);}
  assert.equal(validateExportPayload(payload).ok,true);
  db.close();
});

test('complete JSON import creates pre-import backup and restores data transactionally',async()=>{
  const dir=temp(),source=openDatabase(join(dir,'source.sqlite')),target=openDatabase(join(dir,'target.sqlite'));
  try{
    setMeta(source,'placementLevel','B2');
    source.prepare("INSERT INTO activity(day,xp,attempts,correct) VALUES ('2026-08-28',77,3,2)").run();
    const payload=exportFullData(source,NOW);
    setMeta(target,'placementLevel','A1');
    const result=await importJsonBackup(target,payload,{now:NOW});
    assert.equal(result.ok,true);assert.equal(result.schemaVersion,'SIDES-DB-V10');assert.equal(result.importedTables,EXPORT_TABLES.length);
    assert.equal(target.prepare("SELECT value FROM meta WHERE key='placementLevel'").get().value,'B2');
    assert.equal(target.prepare("SELECT xp FROM activity WHERE day='2026-08-28'").get().xp,77);
    assert.equal(listBackups(target).some(x=>x.kind==='preimport'),true);
  }finally{source.close();target.close();rmSync(dir,{recursive:true,force:true});}
});

test('failed JSON import rolls back instead of leaving partial data',async()=>{
  const dir=temp(),db=openDatabase(join(dir,'sides.sqlite'));
  try{
    setMeta(db,'placementLevel','A2');const payload=exportFullData(db,NOW);
    payload.tables.jw_assignment_practices.push({id:999,assignment_id:999,phase:'rehearsal',duration_ms:1000,ratings_json:'{}',confidence:3,notes:'',practiced_at:NOW.toISOString()});
    payload.manifest.jw_assignment_practices=payload.tables.jw_assignment_practices.length;
    await assert.rejects(()=>importJsonBackup(db,payload,{now:NOW}),/IMPORT_INTEGRITY_FAILED/);
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='placementLevel'").get().value,'A2');
    assert.equal(db.prepare('SELECT COUNT(*) n FROM jw_assignment_practices WHERE id=999').get().n,0);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});

test('SQLite restore is staged, validated and applied only on next database open',async()=>{
  const dir=temp(),sourcePath=join(dir,'source.sqlite'),targetPath=join(dir,'target.sqlite');
  let source=openDatabase(sourcePath);setMeta(source,'placementLevel','B1');source.close();
  let target=openDatabase(targetPath);setMeta(target,'placementLevel','A1');
  try{
    const staged=await stageRestoreBuffer(target,readFileSync(sourcePath),{now:NOW});
    assert.equal(staged.restartRequired,true);assert.equal(staged.validation.quickCheck,true);assert.equal(integrityStatus(target,NOW).restorePending,true);
  }finally{target.close();}
  target=openDatabase(targetPath);
  try{assert.equal(target.prepare("SELECT value FROM meta WHERE key='placementLevel'").get().value,'B1');assert.equal(target.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');assert.equal(integrityStatus(target,NOW).restorePending,false);}
  finally{target.close();rmSync(dir,{recursive:true,force:true});}
});

test('invalid SQLite restore never replaces the live database',async()=>{
  const dir=temp(),path=join(dir,'sides.sqlite'),db=openDatabase(path);setMeta(db,'placementLevel','B2');
  try{
    await assert.rejects(()=>stageRestoreBuffer(db,Buffer.from('not a sqlite database'),{now:NOW}),/RESTORE_DATABASE_INVALID/);
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='placementLevel'").get().value,'B2');
    assert.equal(existsSync(dataPaths(db).restoreMarker),false);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});

test('local logs exclude user content and expire by retention policy',()=>{
  const dir=temp(),db=openDatabase(join(dir,'sides.sqlite'));
  try{
    const paths=dataPaths(db);writeLocalLog(db,'backup-test','ok',{filename:'safe.sqlite',userText:'TextoQueNaoPodeEntrar'},NOW);
    const log=readFileSync(join(paths.logDir,'SIDES-2026-08-28.jsonl'),'utf8');assert.equal(log.includes('TextoQueNaoPodeEntrar'),false);assert.ok(log.includes('backup-test'));
    const old=join(paths.logDir,'SIDES-2026-07-01.jsonl');writeFileSync(old,'{}\n');const oldDate=new Date('2026-07-01T12:00:00Z');utimesSync(old,oldDate,oldDate);
    assert.ok(cleanupLogs(paths.logDir,NOW,30)>=1);assert.equal(existsSync(old),false);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});

test('HTTP integrity API exposes V9, verified backup download and complete export/import',async()=>{
  const dir=temp(),db=openDatabase(join(dir,'sides.sqlite')),server=createSidesServer({db,now:()=>NOW});const base=await listen(server);
  try{
    const health=await fetch(`${base}/api/health`).then(r=>r.json());assert.equal(health.schema,'SIDES-API-V9');
    const status=await fetch(`${base}/api/integrity/status`).then(r=>r.json());assert.equal(status.ok,true);assert.equal(status.integritySchemaVersion,INTEGRITY_SCHEMA_VERSION);
    const createdRes=await fetch(`${base}/api/integrity/backup`,{method:'POST'});assert.equal(createdRes.status,201);const created=await createdRes.json();
    const downloaded=await fetch(`${base}/api/integrity/backups/${encodeURIComponent(created.filename)}`);assert.equal(downloaded.status,200);assert.ok((await downloaded.arrayBuffer()).byteLength>100);
    const exported=await fetch(`${base}/api/export`).then(r=>r.json());assert.equal(exported.schemaVersion,EXPORT_SCHEMA_VERSION);for(const table of EXPORT_TABLES)assert.ok(Array.isArray(exported.tables[table]),table);
    const imported=await fetch(`${base}/api/integrity/import`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exported)}).then(r=>r.json());assert.equal(imported.ok,true);assert.equal(imported.importedTables,EXPORT_TABLES.length);
  }finally{await closeServer(server);db.close();rmSync(dir,{recursive:true,force:true});}
});

test('import rejects unknown tables before any mutation',async()=>{
  const dir=temp(),db=openDatabase(join(dir,'sides.sqlite'));
  try{
    setMeta(db,'placementLevel','A2');const payload=exportFullData(db,NOW);payload.tables.evil_table=[];
    assert.equal(validateExportPayload(payload).error,'IMPORT_UNKNOWN_TABLE');
    await assert.rejects(()=>importJsonBackup(db,payload,{now:NOW}),/IMPORT_UNKNOWN_TABLE/);
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='placementLevel'").get().value,'A2');
    assert.equal(listBackups(db).some(x=>x.kind==='preimport'),false);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
