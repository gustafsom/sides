import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { createSidesServer } from '../src/server.mjs';

async function withServer(fn){
  const db=openDatabase(':memory:');
  const now=()=>new Date('2026-08-28T20:30:00-03:00');
  const server=createSidesServer({db,now});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const base=`http://127.0.0.1:${server.address().port}`;
  try{return await fn({base,db});}
  finally{await new Promise(resolve=>server.close(resolve));db.close();}
}

async function getJson(base,path){
  const response=await fetch(base+path);const json=await response.json();return {response,json};
}

test('release E2E serves UI and core modules through loopback with hardened headers',async()=>withServer(async({base})=>{
  const home=await fetch(base+'/');
  assert.equal(home.status,200);
  assert.match(home.headers.get('content-security-policy')||'',/default-src 'self'/);
  assert.match(home.headers.get('content-security-policy')||'',/object-src 'none'/);
  assert.match(home.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
  assert.equal(home.headers.get('x-content-type-options'),'nosniff');
  assert.equal(home.headers.get('referrer-policy'),'no-referrer');
  assert.equal(home.headers.get('access-control-allow-origin'),null);
  assert.match(await home.text(),/SIDES/i);

  const health=await getJson(base,'/api/health');
  assert.equal(health.response.status,200);assert.equal(health.json.app,'SIDES');assert.equal(health.json.schema,'SIDES-API-V9');

  for(const path of ['/api/dashboard','/api/curriculum','/api/planner/today','/api/jw/overview','/api/immersion/plan']){
    const r=await fetch(base+path);assert.equal(r.status,200,`${path} should respond 200`);assert.match(r.headers.get('content-type')||'',/application\/json/);
  }
}));

test('release E2E keeps unknown APIs and path traversal fail-closed',async()=>withServer(async({base})=>{
  const missing=await fetch(base+'/api/release-does-not-exist');assert.equal(missing.status,404);assert.deepEqual(await missing.json(),{error:'NOT_FOUND'});
  const traversal=await fetch(base+'/%2e%2e/package.json',{redirect:'manual'});assert.equal(traversal.status,404);
  const postStatic=await fetch(base+'/index.html',{method:'POST'});assert.equal(postStatic.status,404);
}));

test('release E2E export remains complete and schema-compatible after normal startup',async()=>withServer(async({base,db})=>{
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');
  const integrity=await fetch(base+'/api/integrity/check',{method:'POST'});assert.equal(integrity.status,200);const checked=await integrity.json();assert.equal(checked.ok,true);
  const exported=await fetch(base+'/api/export');assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition')||'',/SIDES-backup-2026-08-28\.json/);
  const body=await exported.json();assert.equal(body.schema,'SIDES-EXPORT-V9');assert.ok(body.tables);assert.ok(body.manifest);
}));
