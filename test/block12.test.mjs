import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { openDatabase } from '../src/db.mjs';
import { createSidesServer } from '../src/server.mjs';
import {
  WINDOWS_INSTALL_SCHEMA, WINDOWS_PACKAGE_SCHEMA, buildWindowsManifest, safePackagePath,
  validateWindowsManifest, verifyWindowsPackage, writeWindowsManifest
} from '../src/windows-package.mjs';

function temp(){return mkdtempSync(join(tmpdir(),'sides-b12-'));}
function file(root,path,content='x'){
  const full=join(root,...path.split('/'));mkdirSync(dirname(full),{recursive:true});writeFileSync(full,content);
}
function fakePackage(root){
  const required=[
    'INSTALAR-SIDES.ps1','INSTALAR-SIDES.vbs','launcher/SIDES.vbs','launcher/Run-SIDES.ps1',
    'launcher/Atualizar-SIDES.vbs','launcher/Update-SIDES.ps1','launcher/Desinstalar-SIDES.ps1',
    'launcher/CONFIGURAR-VOZ-OFFLINE.ps1','launcher/CONFIGURAR-GRAMATICA-LOCAL.ps1',
    'payload/package.json','payload/runtime/node.exe','payload/src/server.mjs','payload/public/index.html','payload/node_modules/ts-fsrs/package.json'
  ];
  for(const path of required)file(root,path,path==='payload/package.json'?JSON.stringify({name:'sides',version:'0.12.0'}):path);
}

test('Windows package manifest is complete, deterministic in file order and verifiable',()=>{
  const dir=temp();try{
    fakePackage(dir);
    const manifest=writeWindowsManifest(dir,{version:'0.12.0',createdAt:new Date('2026-08-28T23:00:00Z')});
    assert.equal(manifest.schema,WINDOWS_PACKAGE_SCHEMA);assert.equal(manifest.appVersion,'0.12.0');
    assert.deepEqual(manifest.files.map(x=>x.path),[...manifest.files.map(x=>x.path)].sort());
    const verified=verifyWindowsPackage(dir);assert.equal(verified.ok,true);assert.equal(verified.version,'0.12.0');
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('package verification detects modified or unexpected files',()=>{
  const dir=temp();try{
    fakePackage(dir);writeWindowsManifest(dir,{version:'0.12.0'});
    writeFileSync(join(dir,'payload','public','index.html'),'tampered');
    assert.equal(verifyWindowsPackage(dir).error,'PACKAGE_SIZE_MISMATCH');
    writeFileSync(join(dir,'payload','public','index.html'),'payload/public/index.html');
    assert.equal(verifyWindowsPackage(dir).ok,true);
    file(dir,'extra.txt','unexpected');
    assert.equal(verifyWindowsPackage(dir).error,'PACKAGE_FILESET_MISMATCH');
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('manifest rejects traversal, duplicate paths and missing portable layout',()=>{
  assert.throws(()=>safePackagePath('../evil'),/PACKAGE_PATH_INVALID/);
  assert.throws(()=>safePackagePath('C:\\evil'),/PACKAGE_PATH_INVALID/);
  const base={schema:WINDOWS_PACKAGE_SCHEMA,app:'SIDES',appVersion:'0.12.0',architecture:'win-x64',fileCount:1,files:[{path:'../evil',size:1,sha256:'a'.repeat(64)}]};
  assert.equal(validateWindowsManifest(base).error,'PACKAGE_PATH_INVALID');
  const dir=temp();try{
    file(dir,'payload/package.json','{}');
    const m=buildWindowsManifest(dir,{version:'0.12.0'});
    assert.equal(validateWindowsManifest(m).error,'PACKAGE_LAYOUT_INVALID');
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Windows launcher separates immutable versions from persistent data and has no GitHub runtime dependency',()=>{
  const run=readFileSync(new URL('../windows/launcher/Run-SIDES.ps1',import.meta.url),'utf8');
  const install=readFileSync(new URL('../windows/INSTALAR-SIDES.ps1',import.meta.url),'utf8');
  const update=readFileSync(new URL('../windows/launcher/Update-SIDES.ps1',import.meta.url),'utf8');
  const uninstall=readFileSync(new URL('../windows/launcher/Desinstalar-SIDES.ps1',import.meta.url),'utf8');
  assert.match(install,/SIDES-INSTALL-V1/);assert.match(install,/versions\\/);assert.match(install,/dataDir/);
  assert.match(install,/CONFIGURAR-VOZ-OFFLINE\.ps1/);assert.match(install,/CONFIGURAR-GRAMATICA-LOCAL\.ps1/);
  assert.match(run,/SIDES_DATA_DIR/);assert.match(run,/runtime\\node\.exe/);assert.match(run,/WorkingDirectory \$InstallRoot/);
  assert.match(run,/SIDES_WHISPER_BIN/);assert.match(run,/SIDES_LANGUAGETOOL_URL/);assert.equal(/github\.com/i.test(run),false);
  assert.match(update,/UPDATE_EXTERNAL_CHECKSUM_REQUIRED/);assert.match(update,/Get-FileHash/);assert.match(update,/UpdateOnly/);
  assert.match(uninstall,/dados de estudo serao preservados por padrao/i);assert.match(uninstall,/RemoveData/);
  assert.equal(WINDOWS_INSTALL_SCHEMA,'SIDES-INSTALL-V1');
});

test('Windows build recipe embeds Node and dependency but never packages data directory',()=>{
  const build=readFileSync(new URL('../BUILD-WINDOWS-PACKAGE.ps1',import.meta.url),'utf8');
  assert.match(build,/runtime\\node\.exe/);assert.match(build,/node_modules\\ts-fsrs/);assert.match(build,/Compress-Archive/);
  assert.match(build,/CONFIGURAR-VOZ-OFFLINE\.ps1/);assert.match(build,/CONFIGURAR-GRAMATICA-LOCAL\.ps1/);
  assert.match(build,/\.sha256/);assert.equal(/Copy-Item[^\n]+['"]data['"]/i.test(build),false);
});

test('Block 12 keeps application database and API compatibility while package version becomes 0.12.0',async()=>{
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));assert.equal(pkg.version,'0.12.0');
  const db=openDatabase(':memory:');assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');
  const server=createSidesServer({db});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try{const health=await fetch(`http://127.0.0.1:${server.address().port}/api/health`).then(r=>r.json());assert.equal(health.schema,'SIDES-API-V9');}
  finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
