import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const ROOT=resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/,m=>m.slice(1)));
const findings=[];
const fail=(code,detail)=>findings.push({severity:'high',code,detail});
const note=(code,detail)=>findings.push({severity:'info',code,detail});

function text(path){return readFileSync(path,'utf8');}
function walk(dir,out=[]){
  if(!existsSync(dir))return out;
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','data','dist','.git'].includes(entry.name))continue;
    const full=join(dir,entry.name);
    if(entry.isDirectory())walk(full,out);else out.push(full);
  }
  return out;
}

const pkg=JSON.parse(text(join(ROOT,'package.json')));
if(pkg.name!=='curesp')fail('PRODUCT_IDENTITY_INVALID',pkg.name);
if(!/^1\.\d+\.\d+$/.test(pkg.version))fail('RELEASE_VERSION_INVALID',pkg.version);
const deps=Object.entries(pkg.dependencies||{});
if(deps.length!==1||deps[0][0]!=='ts-fsrs'||deps[0][1]!=='5.4.1')fail('DEPENDENCY_ALLOWLIST_DRIFT',JSON.stringify(pkg.dependencies||{}));

const server=text(join(ROOT,'src','server.mjs'));
for(const required of ['127.0.0.1','Content-Security-Policy',"object-src 'none'","frame-ancestors 'none'",'X-Content-Type-Options','Referrer-Policy']){
  if(!server.includes(required))fail('SERVER_SECURITY_INVARIANT_MISSING',required);
}
if(server.includes('0.0.0.0'))fail('NON_LOOPBACK_BIND_FOUND','src/server.mjs');

const codeFiles=[...walk(join(ROOT,'src')),...walk(join(ROOT,'public')),...walk(join(ROOT,'windows'))]
  .filter(p=>['.mjs','.js','.html','.css','.ps1','.vbs'].includes(extname(p).toLowerCase()));
for(const path of codeFiles){
  const body=text(path);const rel=relative(ROOT,path).replaceAll('\\','/');
  if(/\beval\s*\(/.test(body)||/new\s+Function\s*\(/.test(body))fail('DYNAMIC_CODE_EXECUTION',rel);
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(body))fail('PRIVATE_KEY_IN_SOURCE',rel);
  if(/\bgh[pousr]_[A-Za-z0-9]{30,}\b/.test(body))fail('GITHUB_TOKEN_PATTERN',rel);
  if(/\bAKIA[0-9A-Z]{16}\b/.test(body))fail('AWS_KEY_PATTERN',rel);
  if(rel.startsWith('public/')&&/(?:src|href)\s*=\s*["']https?:\/\//i.test(body))fail('REMOTE_FRONTEND_RESOURCE',rel);
}

const ignore=text(join(ROOT,'.gitignore'));
for(const pattern of ['data/*.sqlite','data/backups/','.env','tools/whisper/','tools/languagetool/','models/whisper/']){
  if(!ignore.includes(pattern))fail('GITIGNORE_GUARD_MISSING',pattern);
}
// sides.sqlite permanece como nome técnico legado do banco 1.x para evitar migração destrutiva.
for(const forbidden of ['data/sides.sqlite','.env'])if(existsSync(join(ROOT,forbidden)))fail('LOCAL_SENSITIVE_FILE_PRESENT',forbidden);

const fsrsPkg=join(ROOT,'node_modules','ts-fsrs','package.json');
if(!existsSync(fsrsPkg))fail('FSRS_NOT_INSTALLED','npm install required before security audit');
else{
  const meta=JSON.parse(text(fsrsPkg));
  if(meta.version!=='5.4.1')fail('FSRS_VERSION_DRIFT',meta.version);
  if(String(meta.license||'').toUpperCase()!=='MIT')fail('FSRS_LICENSE_UNEXPECTED',String(meta.license||''));
}

for(const doc of ['THIRD_PARTY_NOTICES.md','SECURITY.md','docs/LICENSE-AUDIT.md'])if(!existsSync(join(ROOT,doc)))fail('SECURITY_DOCUMENT_MISSING',doc);
note('NETWORK_MODEL','Core runtime local-only; optional downloads are explicit setup actions.');
note('PROJECT_LICENSE','CURESP project license is not inferred or changed by this gate; see docs/LICENSE-AUDIT.md.');
note('LEGACY_IDS','SIDES-* schema/runtime identifiers are retained only for backwards compatibility of the 1.x data contract.');

const high=findings.filter(x=>x.severity==='high');
console.log(JSON.stringify({schema:'CURESP-SECURITY-AUDIT-V1',version:pkg.version,ok:high.length===0,high:high.length,findings},null,2));
if(high.length){process.exitCode=1}else{
  console.log('CURESP_SECURITY_AUDIT_OK');
  // Compatibilidade com o teste do gate criado antes da mudança de marca.
  console.log('SIDES_SECURITY_AUDIT_OK');
}
