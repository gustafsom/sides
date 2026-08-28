import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export const WINDOWS_PACKAGE_SCHEMA='SIDES-WINDOWS-PACKAGE-V1';
export const WINDOWS_INSTALL_SCHEMA='SIDES-INSTALL-V1';
export const WINDOWS_ARCH='win-x64';
export const MANIFEST_FILE='package-manifest.json';
export const MANIFEST_SHA_FILE='package-manifest.sha256';

const EXCLUDED=new Set([MANIFEST_FILE,MANIFEST_SHA_FILE]);

export function sha256Buffer(value){return createHash('sha256').update(value).digest('hex');}
export function sha256File(path){return sha256Buffer(readFileSync(path));}

export function safePackagePath(input){
  const raw=String(input||'').replaceAll('\\','/').trim();
  if(!raw||raw.startsWith('/')||/^[a-zA-Z]:/.test(raw)||raw.includes('\0'))throw new Error('PACKAGE_PATH_INVALID');
  const parts=raw.split('/');
  if(parts.some(x=>!x||x==='.'||x==='..'))throw new Error('PACKAGE_PATH_INVALID');
  return parts.join('/');
}

function walk(root,dir=root,out=[]){
  for(const name of readdirSync(dir).sort()){
    const full=join(dir,name);const stat=lstatSync(full);
    if(stat.isSymbolicLink())throw new Error('PACKAGE_SYMLINK_FORBIDDEN');
    if(stat.isDirectory()){walk(root,full,out);continue;}
    if(!stat.isFile())continue;
    const rel=safePackagePath(relative(root,full).split(sep).join('/'));
    if(EXCLUDED.has(rel))continue;
    out.push({path:rel,size:stat.size,sha256:sha256File(full)});
  }
  return out;
}

export function packageFiles(root){return walk(resolve(root));}

export function buildWindowsManifest(root,{version,createdAt=new Date()}={}){
  const appVersion=String(version||'').trim();
  if(!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(appVersion))throw new Error('PACKAGE_VERSION_INVALID');
  const files=packageFiles(root);
  return {
    schema:WINDOWS_PACKAGE_SCHEMA,
    app:'SIDES',
    appVersion,
    architecture:WINDOWS_ARCH,
    createdAt:(createdAt instanceof Date?createdAt:new Date(createdAt)).toISOString(),
    fileCount:files.length,
    files
  };
}

export function writeWindowsManifest(root,options={}){
  const dir=resolve(root);const manifest=buildWindowsManifest(dir,options);
  const text=`${JSON.stringify(manifest,null,2)}\n`;
  const manifestPath=join(dir,MANIFEST_FILE);writeFileSync(manifestPath,text,'utf8');
  const hash=sha256Buffer(Buffer.from(text,'utf8'));
  writeFileSync(join(dir,MANIFEST_SHA_FILE),`${hash} *${MANIFEST_FILE}\n`,'utf8');
  return {...manifest,manifestSha256:hash};
}

function checkRequiredLayout(paths){
  const set=new Set(paths);
  const required=[
    'INSTALAR-SIDES.ps1','INSTALAR-SIDES.vbs',
    'launcher/SIDES.vbs','launcher/Run-SIDES.ps1','launcher/Atualizar-SIDES.vbs','launcher/Update-SIDES.ps1','launcher/Desinstalar-SIDES.ps1',
    'launcher/CONFIGURAR-VOZ-OFFLINE.ps1','launcher/CONFIGURAR-GRAMATICA-LOCAL.ps1',
    'payload/package.json','payload/runtime/node.exe','payload/src/server.mjs','payload/public/index.html','payload/node_modules/ts-fsrs/package.json'
  ];
  const missing=required.filter(x=>!set.has(x));
  return {ok:missing.length===0,missing};
}

export function validateWindowsManifest(manifest){
  if(!manifest||manifest.schema!==WINDOWS_PACKAGE_SCHEMA)return {ok:false,error:'PACKAGE_SCHEMA_INVALID'};
  if(manifest.app!=='SIDES'||manifest.architecture!==WINDOWS_ARCH)return {ok:false,error:'PACKAGE_IDENTITY_INVALID'};
  if(!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(String(manifest.appVersion||'')))return {ok:false,error:'PACKAGE_VERSION_INVALID'};
  if(!Array.isArray(manifest.files)||Number(manifest.fileCount)!==manifest.files.length)return {ok:false,error:'PACKAGE_MANIFEST_COUNT_INVALID'};
  const seen=new Set();
  try{
    for(const file of manifest.files){
      const path=safePackagePath(file?.path);
      if(seen.has(path))return {ok:false,error:'PACKAGE_MANIFEST_DUPLICATE'};
      seen.add(path);
      if(!Number.isInteger(file?.size)||file.size<0||!/^[a-f0-9]{64}$/.test(String(file?.sha256||'')))return {ok:false,error:'PACKAGE_MANIFEST_ENTRY_INVALID'};
    }
  }catch{return {ok:false,error:'PACKAGE_PATH_INVALID'};}
  const layout=checkRequiredLayout([...seen]);
  if(!layout.ok)return {ok:false,error:'PACKAGE_LAYOUT_INVALID',missing:layout.missing};
  return {ok:true,files:seen.size,version:manifest.appVersion};
}

export function verifyWindowsPackage(root,manifestInput=null){
  const dir=resolve(root);
  let manifest=manifestInput;
  try{if(!manifest)manifest=JSON.parse(readFileSync(join(dir,MANIFEST_FILE),'utf8'));}
  catch{return {ok:false,error:'PACKAGE_MANIFEST_INVALID'};}
  const valid=validateWindowsManifest(manifest);if(!valid.ok)return valid;
  const expected=new Map(manifest.files.map(x=>[x.path,x]));
  let actual;
  try{actual=packageFiles(dir);}catch(error){return {ok:false,error:error?.message||'PACKAGE_SCAN_FAILED'};}
  if(actual.length!==expected.size)return {ok:false,error:'PACKAGE_FILESET_MISMATCH'};
  for(const file of actual){
    const wanted=expected.get(file.path);
    if(!wanted)return {ok:false,error:'PACKAGE_UNEXPECTED_FILE',path:file.path};
    if(wanted.size!==file.size)return {ok:false,error:'PACKAGE_SIZE_MISMATCH',path:file.path};
    if(wanted.sha256!==file.sha256)return {ok:false,error:'PACKAGE_CHECKSUM_MISMATCH',path:file.path};
  }
  try{
    const declared=readFileSync(join(dir,MANIFEST_SHA_FILE),'utf8').trim().split(/\s+/)[0].toLowerCase();
    if(!/^[a-f0-9]{64}$/.test(declared)||declared!==sha256File(join(dir,MANIFEST_FILE)))return {ok:false,error:'PACKAGE_MANIFEST_CHECKSUM_MISMATCH'};
  }catch{return {ok:false,error:'PACKAGE_MANIFEST_CHECKSUM_MISSING'};}
  return {ok:true,version:manifest.appVersion,files:actual.length,manifestSha256:sha256File(join(dir,MANIFEST_FILE))};
}

export function packageRuntimeVersion(root){
  try{return JSON.parse(readFileSync(join(resolve(root),'payload','package.json'),'utf8')).version||null;}catch{return null;}
}
