import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, setMeta } from '../src/db.mjs';
import { createSidesServer } from '../src/server.mjs';
import { attentionReport } from '../src/attention.mjs';
import { WRITING_PROMPTS } from '../src/writing-prompts.mjs';
import { checkLanguageTool, fallbackWritingCheck, languageToolConfig } from '../src/writing-runtime.mjs';
import { checkWriting, nextWritingPrompt, submitWriting, writingOverview } from '../src/writing-service.mjs';

const NOW=new Date('2026-08-28T18:00:00Z');
const fallbackOnly={env:{SIDES_LANGUAGETOOL_URL:'https://api.languagetool.org'}};
const CONTENT_COLUMNS=new Set(['text','content','body','original','original_text','corrected','corrected_text','replacement','replacement_text','user_text','source_text']);
const hasContentColumn=columns=>columns.some(x=>CONTENT_COLUMNS.has(String(x).toLowerCase()));

test('writing prompt bank is balanced from A1 through B2',()=>{
  assert.equal(WRITING_PROMPTS.length,32);
  for(const level of ['A1','A2','B1','B2'])assert.equal(WRITING_PROMPTS.filter(x=>x.level===level).length,8);
  assert.ok(WRITING_PROMPTS.some(x=>x.context==='congregation'));
  assert.ok(WRITING_PROMPTS.some(x=>x.context==='talk'));
});

test('fallback catches high-confidence Portuguese interference, accent and punctuation',()=>{
  const result=fallbackWritingCheck('Hoje eu não posso ir tambien?');
  const categories=new Set(result.issues.map(x=>x.category));
  assert.ok(categories.has('pt-interference'));
  assert.ok(categories.has('accent-spelling'));
  assert.ok(categories.has('punctuation'));
  assert.ok(result.issues.some(x=>x.replacements.includes('hoy')));
  assert.ok(result.issues.some(x=>x.replacements.includes('también')));
});

test('LanguageTool adapter blocks public or remote endpoints before network access',async()=>{
  const config=languageToolConfig({SIDES_LANGUAGETOOL_URL:'https://api.languagetool.org'});
  assert.equal(config.allowed,false);
  let calls=0;
  await assert.rejects(()=>checkLanguageTool('Hola mundo',{env:{SIDES_LANGUAGETOOL_URL:'https://api.languagetool.org'},fetchImpl:async()=>{calls++;throw new Error('network')}}),/LANGUAGETOOL_REMOTE_BLOCKED/);
  assert.equal(calls,0);
  const safe=await checkWriting('Hoje eu não sei.',{env:{SIDES_LANGUAGETOOL_URL:'https://api.languagetool.org'},fetchImpl:async()=>{calls++;throw new Error('network')}});
  assert.equal(safe.languageToolUsed,false);
  assert.equal(calls,0);
});

test('local LanguageTool matches are classified and merged with SIDES rules',async()=>{
  const fetchImpl=async(url)=>{
    assert.ok(String(url).startsWith('http://127.0.0.1:8081/'));
    return new Response(JSON.stringify({matches:[{
      message:'Use estar para indicar localização.',shortMessage:'Ser/estar',offset:3,length:3,
      replacements:[{value:'estoy'}],rule:{id:'SER_ESTAR_TEST',category:{id:'GRAMMAR',name:'Grammar'}}
    }],language:{code:'es'},software:{name:'LanguageTool test'}}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const r=await checkWriting('Yo soy en casa.',{env:{SIDES_LANGUAGETOOL_URL:'http://127.0.0.1:8081'},fetchImpl});
  assert.equal(r.languageToolUsed,true);
  assert.ok(r.issues.some(x=>x.category==='ser-estar'&&x.source==='languagetool'));
  assert.ok(r.reviewIndex<100);
});

test('V8 writing schema persists metrics and categories, never produced text',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V8');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='writingSchemaVersion'").get().value,'SIDES-WRITING-V1');
  const attempts=db.prepare('PRAGMA table_info(writing_attempts)').all().map(x=>x.name);
  const issues=db.prepare('PRAGMA table_info(writing_issue_summary)').all().map(x=>x.name);
  assert.ok(attempts.includes('review_index'));
  assert.ok(issues.includes('category'));
  assert.ok(db.prepare('PRAGMA table_info(activity)').all().some(x=>x.name==='writing'));
  assert.equal(hasContentColumn([...attempts,...issues]),false);
});

test('rewrite resolves categories that disappeared and preserves only metrics',async()=>{
  const db=openDatabase(':memory:');
  const first=await submitWriting(db,{text:'Hoje eu não posso ir tambien?',promptId:'a1-mensaje',responseMs:60000},NOW,fallbackOnly);
  assert.ok(first.id>0);
  assert.ok(first.categories.some(x=>x.category==='pt-interference'));
  const second=await submitWriting(db,{text:'Hoy no puedo ir también.',promptId:'a1-mensaje',revisionOf:first.id,responseMs:45000},new Date(NOW.getTime()+60000),fallbackOnly);
  assert.equal(second.revisionOf,first.id);
  assert.ok(second.recovered.includes('pt-interference'));
  assert.ok(second.recovered.includes('accent-spelling'));
  const unresolved=db.prepare("SELECT COUNT(*) n FROM error_log WHERE item_type='writing' AND item_id=? AND resolved_at IS NULL").get(first.id).n;
  assert.equal(Number(unresolved),0);
  const row=db.prepare('SELECT * FROM writing_attempts WHERE id=?').get(first.id);
  assert.equal(hasContentColumn(Object.keys(row)),false);
  const day=db.prepare('SELECT writing FROM activity WHERE day=?').get('2026-08-28');
  assert.equal(day.writing,2);
});

test('writing prompts respect the unassessed A1 gate and adapt to weak skills',async()=>{
  const db=openDatabase(':memory:');
  setMeta(db,'placementLevel','UNASSESSED');
  for(let i=0;i<3;i++)await submitWriting(db,{text:'Hoje eu não posso ir.',responseMs:30000},new Date(NOW.getTime()+i*60000),fallbackOnly);
  const prompt=nextWritingPrompt(db,'pt-interference');
  assert.equal(prompt.level,'A1');
  const attention=attentionReport(db,new Date(NOW.getTime()+180000),20);
  assert.ok(attention.some(x=>x.skillType==='writing'&&x.skillKey==='pt-interference'));
});

test('writing overview reports evolution without returning user text',async()=>{
  const db=openDatabase(':memory:');
  await submitWriting(db,{text:'Hola. Me gusta estudiar español porque es útil.',responseMs:60000},NOW,fallbackOnly);
  const overview=writingOverview(db,30,new Date(NOW.getTime()+1000));
  assert.equal(overview.attempts,1);
  assert.ok(overview.words>0);
  assert.equal(JSON.stringify(overview).includes('Me gusta estudiar'),false);
  assert.ok(overview.recommendation.prompt);
});

test('HTTP writing API uses local LanguageTool mock and backup contains metrics only',async()=>{
  const db=openDatabase(':memory:');
  const fetchImpl=async(url,options={})=>{
    if(String(url).endsWith('/v2/languages'))return new Response(JSON.stringify([{code:'es',name:'Spanish'}]),{status:200,headers:{'Content-Type':'application/json'}});
    if(String(url).endsWith('/v2/check'))return new Response(JSON.stringify({matches:[{
      message:'Prueba local.',offset:0,length:4,replacements:[{value:'Hoy'}],rule:{id:'MORFOLOGIK_RULE_ES',category:{id:'TYPOS',name:'Typos'}}
    }]}),{status:200,headers:{'Content-Type':'application/json'}});
    throw new Error(`unexpected ${url} ${options.method||'GET'}`);
  };
  const server=createSidesServer({db,now:()=>NOW,writingDeps:{env:{SIDES_LANGUAGETOOL_URL:'http://127.0.0.1:8081'},fetchImpl}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try{
    const {port}=server.address(),base=`http://127.0.0.1:${port}`;
    const health=await fetch(`${base}/api/health`).then(r=>r.json());assert.equal(health.schema,'SIDES-API-V7');
    const status=await fetch(`${base}/api/writing/status`).then(r=>r.json());assert.equal(status.languageTool.ready,true);
    const prompt=await fetch(`${base}/api/writing/prompt`).then(r=>r.json());assert.equal(prompt.item.level,'A1');
    const checked=await fetch(`${base}/api/writing/check`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Hoje escrevo em espanhol.'})}).then(r=>r.json());
    assert.equal(checked.languageToolUsed,true);
    const saved=await fetch(`${base}/api/writing/submit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Hoje escrevo em espanhol.',responseMs:45000})}).then(r=>r.json());
    assert.ok(saved.id>0);
    const backup=await fetch(`${base}/api/export`).then(r=>r.json());
    assert.equal(backup.schemaVersion,'SIDES-EXPORT-V7');
    assert.equal(backup.tables.writing_attempts.length,1);
    assert.ok(backup.tables.writing_issue_summary.length>=1);
    assert.equal(JSON.stringify(backup.tables.writing_attempts).includes('Hoje escrevo'),false);
    assert.equal(hasContentColumn(Object.keys(backup.tables.writing_attempts[0])),false);
  }finally{await new Promise(resolve=>server.close(resolve))}
});
