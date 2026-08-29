import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { openDatabase } from '../src/db.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('CURESP 1.x preserves DB/API/export compatibility instead of introducing a destructive migration',()=>{
  const pkg=JSON.parse(read('package.json'));assert.equal(pkg.name,'curesp');assert.equal(pkg.version,'1.1.0');assert.equal(pkg.dependencies['ts-fsrs'],'5.4.1');
  const db=openDatabase(':memory:');
  try{assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');}
  finally{db.close();}
  assert.match(read('src/server.mjs'),/SIDES-API-V9/);assert.match(read('src/integrity.mjs'),/SIDES-EXPORT-V9/);
});

test('release documentation and notices cover CURESP identity, security, acceptance, licenses and changelog',()=>{
  assert.match(read('CHANGELOG.md'),/## \[1\.1\.0\] - Em desenvolvimento/);
  assert.match(read('CHANGELOG.md'),/## \[1\.0\.0\] - 2026-08-29/);
  assert.match(read('CHANGELOG.md'),/Identidade CURESP/);
  assert.match(read('THIRD_PARTY_NOTICES.md'),/ts-fsrs 5\.4\.1/);assert.match(read('THIRD_PARTY_NOTICES.md'),/Node\.js/);
  assert.match(read('docs/LICENSE-AUDIT.md'),/não constitui parecer jurídico/i);
  assert.match(read('README.md'),/CURESP 1\.0\.0/);assert.match(read('README.md'),/CURESP-GATE\.ps1/);
  assert.match(read('docs/RELEASE-1.0.md'),/protected: false/);
  assert.match(read('SECURITY.md'),/Versões suportadas/);
});

test('rollback is fail-closed, switches only version pointers and keeps persistent data directory',()=>{
  const rollback=read('windows/launcher/Rollback-SIDES.ps1');
  assert.match(rollback,/SIDES-INSTALL-V1/);assert.match(rollback,/ROLLBACK_VERSION_NOT_AVAILABLE/);
  assert.match(rollback,/CURESP/);assert.match(rollback,/current=\$previous/);assert.match(rollback,/previous=\$current/);assert.match(rollback,/dataDir=\[string\]\$state\.dataDir/);
  assert.equal(/Remove-Item[^\n]*(?:dataDir|sides\.sqlite)/i.test(rollback),false);
});

test('CURESP SISDEV gate is exact-SHA, clean-tree, READ_ONLY and publishes sanitized result contract',()=>{
  const gate=read('CURESP-GATE.ps1');
  assert.match(gate,/ValidatePattern\('\^\[0-9a-fA-F\]\{40\}\$'\)/);assert.match(gate,/rev-parse HEAD/);assert.match(gate,/status --porcelain/);
  assert.match(gate,/mode='READ_ONLY'/);assert.match(gate,/pipeline='curesp-release-local'/);assert.match(gate,/SISDEV-CURESP-GATE-V1/);
  assert.match(gate,/Downloads\\SISDEV\\RESULTADOS\\curesp/);
  assert.equal(/git\s+(?:pull|fetch|reset|clean|checkout)/i.test(gate),false);
  assert.equal(/deploy|wrangler|cloudflare|soc[_ -]?write/i.test(gate),false);
});

test('security audit executable passes against the current CURESP 1.x source tree',()=>{
  const r=spawnSync(process.execPath,['scripts/security-audit.mjs'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.match(r.stdout,/CURESP_SECURITY_AUDIT_OK/);assert.match(r.stdout,/"high": 0/);assert.match(r.stdout,/"version": "1\.1\.0"/);
});

test('release static gate executable passes against the current CURESP 1.x source contract',()=>{
  const r=spawnSync(process.execPath,['scripts/release-gate.mjs'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.match(r.stdout,/CURESP_RELEASE_GATE_OK/);assert.match(r.stdout,/"version": "1\.1\.0"/);
});
