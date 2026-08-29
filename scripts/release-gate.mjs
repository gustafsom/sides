import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT=resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/,m=>m.slice(1)));
const errors=[];
const read=path=>readFileSync(resolve(ROOT,path),'utf8');
const requireFile=path=>{if(!existsSync(resolve(ROOT,path)))errors.push(`MISSING:${path}`)};
const requireText=(path,needle)=>{requireFile(path);if(existsSync(resolve(ROOT,path))&&!read(path).includes(needle))errors.push(`MISSING_TEXT:${path}:${needle}`)};

const pkg=JSON.parse(read('package.json'));
if(pkg.name!=='curesp')errors.push(`PACKAGE_NAME:${pkg.name}`);
if(!/^1\.\d+\.\d+$/.test(pkg.version))errors.push(`VERSION:${pkg.version}`);
if(pkg.dependencies?.['ts-fsrs']!=='5.4.1')errors.push('FSRS_NOT_PINNED_5_4_1');
for(const path of ['CHANGELOG.md','THIRD_PARTY_NOTICES.md','SECURITY.md','docs/LICENSE-AUDIT.md','docs/RELEASE-1.0.md','docs/ACCEPTANCE-1.0.md','CURESP-GATE.ps1','SISDEV-GATE.ps1','INICIAR-CURESP.ps1','windows/INSTALAR-CURESP.vbs'])requireFile(path);
requireText('README.md','CURESP 1.0.0');
requireText('README.md','SIDES-DB-V10');
requireText('README.md','IDs internos');
requireText('docs/ROADMAP.md','Bloco 13 — Qualidade, segurança, SISDEV e Release 1.0 ✅');
requireText('CHANGELOG.md',`## [${pkg.version}]`);
requireText('CHANGELOG.md','## [1.0.0] - 2026-08-29');
requireText('THIRD_PARTY_NOTICES.md','ts-fsrs 5.4.1');
requireText('THIRD_PARTY_NOTICES.md','Node.js');
requireText('SECURITY.md','Versões suportadas');
requireText('windows/INSTALAR-SIDES.ps1','CURESP');
requireText('BUILD-WINDOWS-PACKAGE.ps1','CURESP-$version-windows-x64.zip');
requireText('.github/workflows/ci.yml','CURESP-Windows-${{ github.sha }}');
requireText('.github/workflows/ci.yml','Installed package smoke test');

const db=read('src/db.mjs');
const server=read('src/server.mjs');
const integrity=read('src/integrity.mjs');
if(!db.includes('SIDES-DB-V10'))errors.push('DB_SCHEMA_DRIFT');
if(!server.includes('SIDES-API-V9'))errors.push('API_SCHEMA_DRIFT');
if(!integrity.includes('SIDES-EXPORT-V9'))errors.push('EXPORT_SCHEMA_DRIFT');

console.log(JSON.stringify({schema:'CURESP-RELEASE-GATE-V1',version:pkg.version,ok:errors.length===0,errors},null,2));
if(errors.length)process.exitCode=1;
else{
  console.log('CURESP_RELEASE_GATE_OK');
  // Compatibilidade com a suíte de validação criada antes da mudança de marca.
  console.log('SIDES_RELEASE_GATE_OK');
}
