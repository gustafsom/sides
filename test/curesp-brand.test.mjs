import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('CURESP is the official package and README identity',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.name,'curesp');assert.match(pkg.version,/^1\.\d+\.\d+$/);
  assert.match(read('README.md'),/^# CURESP/m);assert.match(read('README.md'),/CURESP 1\.0\.0/);
});

test('all user-facing HTML pages use CURESP and do not expose SIDES as brand',()=>{
  const publicDir=new URL('../public/',import.meta.url);
  const files=readdirSync(publicDir).filter(name=>name.endsWith('.html'));
  assert.ok(files.length>=7);
  for(const name of files){
    const body=read(`public/${name}`);
    assert.match(body,/CURESP/,`${name} must show CURESP`);
    assert.doesNotMatch(body,/\bSIDES\b/,`${name} must not expose legacy brand`);
  }
});

test('source launcher and SISDEV gate expose CURESP while legacy runtime ids remain isolated',()=>{
  const launcher=read('INICIAR-CURESP.ps1');const gate=read('CURESP-GATE.ps1');
  assert.match(launcher,/Iniciando CURESP/);assert.match(gate,/SISDEV-CURESP-GATE-V1/);assert.match(gate,/curesp-release-local/);
  assert.match(launcher,/SIDES_PORT/); // compatibility-only runtime id
});

test('Windows package and installer present CURESP entry points',()=>{
  const build=read('BUILD-WINDOWS-PACKAGE.ps1');const installer=read('windows/INSTALAR-SIDES.ps1');
  assert.match(build,/CURESP-\$version-windows-x64\.zip/);assert.match(build,/INSTALAR-CURESP\.ps1/);assert.match(build,/INSTALAR-CURESP\.vbs/);
  assert.match(installer,/LocalApplicationData'\)\) 'CURESP'/);assert.match(installer,/CURESP\.lnk/);assert.match(installer,/CURESP\.vbs/);
});

test('legacy SIDES schema ids are documented compatibility contracts, not product identity',()=>{
  const readme=read('README.md');
  for(const id of ['SIDES-DB-V10','SIDES-API-V9','SIDES-EXPORT-V9','SIDES-INSTALL-V1','sides.sqlite'])assert.match(readme,new RegExp(id.replaceAll('.','\\.')));
  assert.match(readme,/identidade oficial.*CURESP/is);
});
