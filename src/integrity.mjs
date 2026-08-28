import { createHash } from 'node:crypto';
import { backup, DatabaseSync } from 'node:sqlite';
import {
  appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync,
  renameSync, rmSync, statSync, writeFileSync
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

export const INTEGRITY_SCHEMA_VERSION='SIDES-INTEGRITY-V1';
export const EXPORT_SCHEMA_VERSION='SIDES-EXPORT-V9';
export const BACKUP_FORMAT='SIDES-SQLITE-BACKUP-V1';
export const BACKUP_POLICY=Object.freeze({auto:14,manual:10,preimport:5,prerestore:5,logsDays:30});

export const EXPORT_TABLES=Object.freeze([
  'meta','vocabulary','srs','reviews','grammar_exercises','listening_items','reading_texts','placement_items','learning_items',
  'activity','skill_mastery','skill_events','error_log','curriculum_meta','jw_assignments','jw_assignment_practices','speech_attempts',
  'writing_attempts','writing_issue_summary','immersion_sessions','immersion_turn_metrics','study_goals','maintenance_state'
]);

const BACKUP_RE=/^SIDES-(auto|manual|preimport|prerestore)-([0-9TZ-]+)\.sqlite$/;
const LOG_RE=/^SIDES-\d{4}-\d{2}-\d{2}\.jsonl$/;
const CORE_TABLES=['meta','vocabulary','srs','reviews','activity'];
const APP_SCHEMA='SIDES-DB-V10';

const isoStamp=(date=new Date())=>date.toISOString().replace(/[:.]/g,'-');
const safeNow=(now)=>now instanceof Date?now:new Date(now||Date.now());

export function databaseFile(db){
  const row=db.prepare('PRAGMA database_list').all().find(x=>x.name==='main');
  const file=String(row?.file||'').trim();
  return file?resolve(file):null;
}

export function dataPaths(dbOrPath){
  const file=typeof dbOrPath==='string'?resolve(dbOrPath):databaseFile(dbOrPath);
  if(!file)return {database:null,dataDir:null,backupDir:null,logDir:null,recoveryDir:null,restoreMarker:null,restorePending:null};
  const dataDir=dirname(file);
  return {
    database:file,
    dataDir,
    backupDir:join(dataDir,'backups'),
    logDir:join(dataDir,'logs'),
    recoveryDir:join(dataDir,'recovery'),
    restoreMarker:join(dataDir,'restore-pending.json'),
    restorePending:join(dataDir,'restore-pending.sqlite')
  };
}

function ensureDirs(paths){
  for(const dir of [paths.dataDir,paths.backupDir,paths.logDir,paths.recoveryDir])if(dir)mkdirSync(dir,{recursive:true});
}

function tableExists(db,name){return Boolean(db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name=?").get(name));}
function quickCheck(db){
  const rows=db.prepare('PRAGMA quick_check').all();
  return rows.length===1&&String(rows[0].quick_check||Object.values(rows[0])[0])==='ok';
}
function foreignKeyViolations(db){return db.prepare('PRAGMA foreign_key_check').all();}
function sha256File(path){
  const h=createHash('sha256');h.update(readFileSync(path));return h.digest('hex');
}
function fileInfo(path){const s=statSync(path);return {size:s.size,modifiedAt:s.mtime.toISOString()};}

export function ensureIntegritySchema(db,now=new Date()){
  db.exec(`CREATE TABLE IF NOT EXISTS maintenance_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;`);
  db.prepare(`INSERT INTO meta(key,value) VALUES ('integritySchemaVersion',?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(INTEGRITY_SCHEMA_VERSION);
  touchState(db,'integritySchemaVersion',INTEGRITY_SCHEMA_VERSION,now);
}

export function touchState(db,key,value,now=new Date()){
  if(!tableExists(db,'maintenance_state'))return;
  db.prepare(`INSERT INTO maintenance_state(key,value,updated_at) VALUES (?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`)
    .run(String(key),String(value),safeNow(now).toISOString());
}

function scrubDetails(details={}){
  const allowed=new Set(['kind','filename','size','sha256','schemaVersion','tables','reason','restored','importedTables','deleted','retained','quickCheck','foreignKeyViolations']);
  const out={};
  for(const [k,v] of Object.entries(details||{})){
    if(!allowed.has(k))continue;
    if(typeof v==='string')out[k]=v.slice(0,160);
    else if(typeof v==='number'||typeof v==='boolean'||v===null)out[k]=v;
    else if(Array.isArray(v))out[k]=v.slice(0,50).map(x=>String(x).slice(0,80));
  }
  return out;
}

export function cleanupLogs(logDir,now=new Date(),days=BACKUP_POLICY.logsDays){
  if(!logDir||!existsSync(logDir))return 0;
  const cutoff=safeNow(now).getTime()-Math.max(1,Number(days)||30)*86_400_000;
  let deleted=0;
  for(const name of readdirSync(logDir).filter(x=>LOG_RE.test(x))){
    const path=join(logDir,name);
    if(statSync(path).mtimeMs<cutoff){rmSync(path,{force:true});deleted++;}
  }
  const remaining=readdirSync(logDir).filter(x=>LOG_RE.test(x)).map(name=>({name,path:join(logDir,name)}))
    .sort((a,b)=>statSync(b.path).mtimeMs-statSync(a.path).mtimeMs);
  for(const entry of remaining.slice(Math.max(1,Number(days)||30))){rmSync(entry.path,{force:true});deleted++;}
  return deleted;
}

export function writeLocalLog(db,event,status='ok',details={},now=new Date()){
  const paths=dataPaths(db);if(!paths.logDir)return null;ensureDirs(paths);
  cleanupLogs(paths.logDir,now);
  const day=safeNow(now).toISOString().slice(0,10);
  const record={at:safeNow(now).toISOString(),event:String(event).slice(0,80),status:String(status).slice(0,24),details:scrubDetails(details)};
  const file=join(paths.logDir,`SIDES-${day}.jsonl`);
  appendFileSync(file,`${JSON.stringify(record)}\n`,{encoding:'utf8',mode:0o600});
  return basename(file);
}

export function validateDatabaseFile(path,{requireCore=true}={}){
  const file=resolve(path);
  if(!existsSync(file))return {ok:false,error:'BACKUP_FILE_NOT_FOUND'};
  let db;
  try{
    const info=fileInfo(file);
    if(info.size<100)return {ok:false,error:'BACKUP_FILE_TOO_SMALL',...info};
    db=new DatabaseSync(file,{readOnly:true,timeout:3000});
    const qc=quickCheck(db);
    const fk=foreignKeyViolations(db);
    const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x=>x.name);
    const missing=requireCore?CORE_TABLES.filter(x=>!tables.includes(x)):[];
    const schemaVersion=tableExists(db,'meta')?db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get()?.value||null:null;
    const ok=qc&&fk.length===0&&missing.length===0&&(!requireCore||String(schemaVersion||'').startsWith('SIDES-DB-V'));
    return {ok,format:BACKUP_FORMAT,quickCheck:qc,foreignKeyViolations:fk.length,missingTables:missing,schemaVersion,size:info.size,modifiedAt:info.modifiedAt,sha256:sha256File(file),tables:tables.length};
  }catch(error){return {ok:false,error:'BACKUP_INVALID',reason:String(error?.message||error).slice(0,180)};}
  finally{try{db?.close();}catch{}}
}

export function runIntegrityCheck(db,now=new Date()){
  let qc=false,fk=[];
  try{qc=quickCheck(db);fk=foreignKeyViolations(db);}catch(error){
    writeLocalLog(db,'integrity-check','error',{reason:error?.message||'check failed'},now);
    return {ok:false,quickCheck:false,foreignKeyViolations:-1,error:'INTEGRITY_CHECK_FAILED'};
  }
  const result={ok:qc&&fk.length===0,quickCheck:qc,foreignKeyViolations:fk.length,schemaVersion:db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get()?.value||null};
  touchState(db,'lastIntegrityCheckAt',safeNow(now).toISOString(),now);
  writeLocalLog(db,'integrity-check',result.ok?'ok':'failed',result,now);
  return result;
}

export function listBackups(db){
  const paths=dataPaths(db);if(!paths.backupDir||!existsSync(paths.backupDir))return [];
  return readdirSync(paths.backupDir).map(name=>{
    const match=name.match(BACKUP_RE);if(!match)return null;
    const path=join(paths.backupDir,name);const info=fileInfo(path);
    return {filename:name,kind:match[1],size:info.size,modifiedAt:info.modifiedAt};
  }).filter(Boolean).sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt));
}

function rotateBackups(dir,policy=BACKUP_POLICY){
  if(!existsSync(dir))return {deleted:0,retained:0};
  let deleted=0,retained=0;
  for(const kind of ['auto','manual','preimport','prerestore']){
    const limit=Math.max(1,Number(policy[kind]||1));
    const rows=readdirSync(dir).filter(name=>name.startsWith(`SIDES-${kind}-`)&&name.endsWith('.sqlite'))
      .map(name=>({name,path:join(dir,name),mtime:statSync(join(dir,name)).mtimeMs})).sort((a,b)=>b.mtime-a.mtime);
    retained+=Math.min(rows.length,limit);
    for(const row of rows.slice(limit)){rmSync(row.path,{force:true});deleted++;}
  }
  return {deleted,retained};
}

export async function createDatabaseBackup(db,{kind='manual',now=new Date(),policy=BACKUP_POLICY}={}){
  if(!['auto','manual','preimport','prerestore'].includes(kind))throw new Error('BACKUP_KIND_INVALID');
  const paths=dataPaths(db);if(!paths.database)throw new Error('BACKUP_FILE_DATABASE_REQUIRED');ensureDirs(paths);
  const stamp=isoStamp(safeNow(now));
  const finalPath=join(paths.backupDir,`SIDES-${kind}-${stamp}.sqlite`);
  const tempPath=`${finalPath}.partial`;
  rmSync(tempPath,{force:true});
  try{
    const pages=await backup(db,tempPath,{rate:256});
    const validation=validateDatabaseFile(tempPath);
    if(!validation.ok)throw new Error(`BACKUP_VALIDATION_FAILED:${validation.error||validation.reason||'unknown'}`);
    renameSync(tempPath,finalPath);
    const rotation=rotateBackups(paths.backupDir,policy);
    const result={ok:true,kind,filename:basename(finalPath),pages,size:validation.size,sha256:validation.sha256,schemaVersion:validation.schemaVersion,quickCheck:true,foreignKeyViolations:0,rotation};
    touchState(db,'lastBackupAt',safeNow(now).toISOString(),now);
    touchState(db,'lastBackupFile',result.filename,now);
    writeLocalLog(db,'backup-create','ok',{kind,filename:result.filename,size:result.size,sha256:result.sha256,schemaVersion:result.schemaVersion,deleted:rotation.deleted,retained:rotation.retained},now);
    return result;
  }catch(error){
    rmSync(tempPath,{force:true});
    writeLocalLog(db,'backup-create','error',{kind,reason:error?.message||'backup failed'},now);
    throw error;
  }
}

export async function ensureAutomaticBackup(db,now=new Date(),{maxAgeMs=86_400_000,policy=BACKUP_POLICY}={}){
  const paths=dataPaths(db);if(!paths.database)return {ok:true,skipped:true,reason:'MEMORY_DATABASE'};
  ensureDirs(paths);
  const latest=listBackups(db).find(x=>x.kind==='auto');
  if(latest&&safeNow(now).getTime()-new Date(latest.modifiedAt).getTime()<maxAgeMs)return {ok:true,skipped:true,reason:'AUTO_BACKUP_FRESH',latest};
  return createDatabaseBackup(db,{kind:'auto',now,policy});
}

export function startAutomaticBackupScheduler(db,{intervalMs=21_600_000,maxAgeMs=86_400_000,now=()=>new Date()}={}){
  if(!databaseFile(db))return ()=>{};
  let running=false;
  const timer=setInterval(async()=>{
    if(running)return;running=true;
    try{await ensureAutomaticBackup(db,now(),{maxAgeMs});}catch(error){writeLocalLog(db,'backup-auto','error',{reason:error?.message||'auto backup failed'},now());}
    finally{running=false;}
  },Math.max(3_600_000,Number(intervalMs)||21_600_000));
  timer.unref?.();
  return ()=>clearInterval(timer);
}

function atomicJson(path,value){const temp=`${path}.tmp`;writeFileSync(temp,JSON.stringify(value,null,2),{encoding:'utf8',mode:0o600});renameSync(temp,path);}

export async function stageRestoreBuffer(db,buffer,{now=new Date()}={}){
  if(!Buffer.isBuffer(buffer)&&!(buffer instanceof Uint8Array))throw new Error('RESTORE_SQLITE_REQUIRED');
  const paths=dataPaths(db);if(!paths.database)throw new Error('RESTORE_FILE_DATABASE_REQUIRED');ensureDirs(paths);
  await createDatabaseBackup(db,{kind:'prerestore',now});
  const upload=join(paths.recoveryDir,`restore-upload-${isoStamp(safeNow(now))}.sqlite`);
  writeFileSync(upload,buffer,{mode:0o600});
  const validation=validateDatabaseFile(upload);
  if(!validation.ok){rmSync(upload,{force:true});writeLocalLog(db,'restore-stage','error',{reason:validation.error||validation.reason||'invalid'},now);throw new Error('RESTORE_DATABASE_INVALID');}
  copyFileSync(upload,paths.restorePending);rmSync(upload,{force:true});
  const pendingHash=sha256File(paths.restorePending);
  const marker={format:'SIDES-RESTORE-PENDING-V1',createdAt:safeNow(now).toISOString(),sha256:pendingHash,schemaVersion:validation.schemaVersion,size:validation.size};
  atomicJson(paths.restoreMarker,marker);
  touchState(db,'restorePending','true',now);
  writeLocalLog(db,'restore-stage','ok',{filename:basename(paths.restorePending),size:validation.size,sha256:pendingHash,schemaVersion:validation.schemaVersion},now);
  return {ok:true,restartRequired:true,validation:{quickCheck:true,foreignKeyViolations:0,schemaVersion:validation.schemaVersion,size:validation.size,sha256:pendingHash}};
}

export function applyPendingRestore(dbPath,{now=new Date()}={}){
  if(!dbPath||dbPath===':memory:')return {applied:false,reason:'MEMORY_DATABASE'};
  const paths=dataPaths(dbPath);ensureDirs(paths);
  if(!existsSync(paths.restoreMarker))return {applied:false,reason:'NO_PENDING_RESTORE'};
  const marker=JSON.parse(readFileSync(paths.restoreMarker,'utf8'));
  if(marker.format!=='SIDES-RESTORE-PENDING-V1'||!existsSync(paths.restorePending))throw new Error('RESTORE_PENDING_INVALID');
  const validation=validateDatabaseFile(paths.restorePending);
  if(!validation.ok||validation.sha256!==marker.sha256)throw new Error('RESTORE_PENDING_VALIDATION_FAILED');
  const stamp=isoStamp(safeNow(now));
  const oldMain=join(paths.recoveryDir,`SIDES-before-restore-${stamp}.sqlite.raw`);
  const oldWal=`${oldMain}-wal`,oldShm=`${oldMain}-shm`;
  const liveWal=`${paths.database}-wal`,liveShm=`${paths.database}-shm`;
  let movedMain=false,movedWal=false,movedShm=false;
  try{
    if(existsSync(paths.database)){renameSync(paths.database,oldMain);movedMain=true;}
    if(existsSync(liveWal)){renameSync(liveWal,oldWal);movedWal=true;}
    if(existsSync(liveShm)){renameSync(liveShm,oldShm);movedShm=true;}
    renameSync(paths.restorePending,paths.database);
    rmSync(paths.restoreMarker,{force:true});
    return {applied:true,restored:basename(paths.database),schemaVersion:validation.schemaVersion,sha256:validation.sha256};
  }catch(error){
    try{if(existsSync(paths.database))rmSync(paths.database,{force:true});}catch{}
    try{if(movedMain&&existsSync(oldMain))renameSync(oldMain,paths.database);}catch{}
    try{if(movedWal&&existsSync(oldWal))renameSync(oldWal,liveWal);}catch{}
    try{if(movedShm&&existsSync(oldShm))renameSync(oldShm,liveShm);}catch{}
    throw error;
  }
}

export function exportFullData(db,now=new Date()){
  const tables={};const manifest={};
  for(const table of EXPORT_TABLES){
    if(!tableExists(db,table))continue;
    const rows=db.prepare(`SELECT * FROM ${table}`).all();
    tables[table]=rows;manifest[table]=rows.length;
  }
  return {schemaVersion:EXPORT_SCHEMA_VERSION,appSchemaVersion:db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get()?.value||null,format:'SIDES-JSON-BACKUP-V1',exportedAt:safeNow(now).toISOString(),manifest,tables};
}

export function validateExportPayload(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return {ok:false,error:'IMPORT_JSON_OBJECT_REQUIRED'};
  if(!/^SIDES-EXPORT-V(?:3|4|5|6|7|8|9)$/.test(String(payload.schemaVersion||'')))return {ok:false,error:'IMPORT_SCHEMA_UNSUPPORTED'};
  if(!payload.tables||typeof payload.tables!=='object'||Array.isArray(payload.tables))return {ok:false,error:'IMPORT_TABLES_REQUIRED'};
  if(!Array.isArray(payload.tables.meta)||!Array.isArray(payload.tables.vocabulary))return {ok:false,error:'IMPORT_CORE_TABLES_REQUIRED'};
  const unknown=Object.keys(payload.tables).filter(x=>!EXPORT_TABLES.includes(x));
  if(unknown.length)return {ok:false,error:'IMPORT_UNKNOWN_TABLE',tables:unknown};
  if(payload.schemaVersion===EXPORT_SCHEMA_VERSION){
    const missing=EXPORT_TABLES.filter(x=>!Array.isArray(payload.tables[x]));
    if(missing.length)return {ok:false,error:'IMPORT_INCOMPLETE_V9',tables:missing};
    if(payload.manifest&&typeof payload.manifest==='object'){
      for(const table of EXPORT_TABLES)if(Number(payload.manifest[table])!==payload.tables[table].length)return {ok:false,error:'IMPORT_MANIFEST_MISMATCH',tables:[table]};
    }
  }
  return {ok:true,schemaVersion:payload.schemaVersion,tables:Object.keys(payload.tables)};
}

function insertRows(db,table,rows){
  if(!Array.isArray(rows))throw new Error('IMPORT_TABLE_INVALID');
  if(!tableExists(db,table))throw new Error(`IMPORT_TARGET_TABLE_MISSING:${table}`);
  const columns=new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name));
  for(const row of rows){
    if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`IMPORT_ROW_INVALID:${table}`);
    const keys=Object.keys(row).filter(x=>columns.has(x));
    if(!keys.length)throw new Error(`IMPORT_ROW_EMPTY:${table}`);
    const sql=`INSERT INTO ${table}(${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    db.prepare(sql).run(...keys.map(k=>row[k]??null));
  }
}

export async function importJsonBackup(db,payload,{now=new Date()}={}){
  const validation=validateExportPayload(payload);if(!validation.ok)throw new Error(validation.error);
  await createDatabaseBackup(db,{kind:'preimport',now});
  const supplied=EXPORT_TABLES.filter(t=>Array.isArray(payload.tables[t])&&tableExists(db,t));
  db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;');
  try{
    for(const table of [...supplied].reverse())db.exec(`DELETE FROM ${table}`);
    for(const table of supplied)insertRows(db,table,payload.tables[table]);
    db.prepare(`INSERT INTO meta(key,value) VALUES ('schemaVersion',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(APP_SCHEMA);
    db.prepare(`INSERT INTO meta(key,value) VALUES ('integritySchemaVersion',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(INTEGRITY_SCHEMA_VERSION);
    const qc=quickCheck(db),fk=foreignKeyViolations(db);
    if(!qc||fk.length)throw new Error('IMPORT_INTEGRITY_FAILED');
    db.exec('COMMIT;');
    db.exec('PRAGMA foreign_keys=ON;');
    touchState(db,'lastImportAt',safeNow(now).toISOString(),now);
    writeLocalLog(db,'json-import','ok',{schemaVersion:payload.schemaVersion,importedTables:supplied},now);
    return {ok:true,schemaVersion:APP_SCHEMA,sourceSchema:payload.schemaVersion,importedTables:supplied.length,quickCheck:true,foreignKeyViolations:0};
  }catch(error){
    try{db.exec('ROLLBACK;');}catch{}
    try{db.exec('PRAGMA foreign_keys=ON;');}catch{}
    writeLocalLog(db,'json-import','error',{schemaVersion:payload.schemaVersion,reason:error?.message||'import failed'},now);
    throw error;
  }
}

export function readLocalBackup(db,filename){
  const name=String(filename||'');
  if(basename(name)!==name||!BACKUP_RE.test(name))throw new Error('BACKUP_FILENAME_INVALID');
  const paths=dataPaths(db);if(!paths.backupDir)throw new Error('BACKUP_FILE_DATABASE_REQUIRED');
  const path=join(paths.backupDir,name);const validation=validateDatabaseFile(path);
  if(!validation.ok)throw new Error('BACKUP_VALIDATION_FAILED');
  return {buffer:readFileSync(path),validation,filename:name};
}

export async function stageRestoreFromBackup(db,filename,{now=new Date()}={}){
  const local=readLocalBackup(db,filename);
  return stageRestoreBuffer(db,local.buffer,{now});
}

export function integrityStatus(db,now=new Date()){
  const paths=dataPaths(db);const check=runIntegrityCheck(db,now);const backups=listBackups(db);
  return {
    ...check,
    integritySchemaVersion:db.prepare("SELECT value FROM meta WHERE key='integritySchemaVersion'").get()?.value||null,
    backupPolicy:BACKUP_POLICY,
    backupDirectory:paths.backupDir?basename(paths.backupDir):null,
    backups,
    lastBackup:backups[0]||null,
    restorePending:Boolean(paths.restoreMarker&&existsSync(paths.restoreMarker)),
    logs:{directory:paths.logDir?basename(paths.logDir):null,retentionDays:BACKUP_POLICY.logsDays}
  };
}
