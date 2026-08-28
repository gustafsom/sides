import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/db.mjs';
import { alignSpeech, speechMetrics } from '../src/speech-align.mjs';
import { analyzeSpeech, nextSpeechTarget, speechOverview } from '../src/speech-service.mjs';
import { parseWhisperJson, speechRuntimeStatus, transcribeWhisper } from '../src/speech-runtime.mjs';
import { piperStatus } from '../src/tts-runtime.mjs';
import { createSidesServer } from '../src/server.mjs';

const NOW=new Date('2026-08-28T15:00:00Z');

test('word alignment distinguishes omissions substitutions additions and accent-only differences',()=>{
  const accent=alignSpeech('El español es útil','El espanol es útil');
  assert.equal(accent.counts.accent,1);
  assert.equal(accent.accuracy,100);
  assert.ok(accent.strictAccuracy<100);

  const omitted=alignSpeech('Hoy vamos a leer despacio','Hoy vamos leer despacio');
  assert.equal(omitted.counts.omit,1);
  assert.ok(omitted.accuracy<100);

  const substituted=alignSpeech('Hoy vamos a leer despacio','Hoy vamos a leer rápido');
  assert.equal(substituted.counts.substitute,1);
  assert.ok(substituted.accuracy<100);

  const added=alignSpeech('Hoy vamos a leer','Hoy vamos ahora a leer');
  assert.equal(added.counts.add,1);
  assert.equal(added.accuracy,100);
});

test('speech metrics expose pace and pause indicators without pretending to score accent',()=>{
  const m=speechMetrics({expected:'Uno dos tres cuatro cinco seis',recognized:'Uno dos tres cuatro cinco',durationMs:10000,audioStats:{pauseCount:4,longPauses:3,maxPauseMs:1200,totalSilenceMs:2800}});
  assert.equal(m.counts.omit,1);
  assert.equal(m.wpm,30);
  assert.ok(m.flags.includes('omissions'));
  assert.ok(m.flags.includes('many-long-pauses'));
  assert.ok(m.flags.includes('pace-slow'));
});

test('V8 preserves speech metrics only, never audio transcript or expected text',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V8');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='speechSchemaVersion'").get().value,'SIDES-SPEECH-V1');
  const cols=db.prepare('PRAGMA table_info(speech_attempts)').all().map(x=>x.name);
  assert.equal(cols.some(x=>/audio|blob|transcript|expected_text|recognized_text/i.test(x)),false);
  const result=analyzeSpeech(db,{expected:'La lectura es clara y natural.',transcript:'La lectura es clara natural.',contextType:'jw-reading',durationMs:6000,audioStats:{pauseCount:1,longPauses:0,maxPauseMs:400,totalSilenceMs:500}},NOW);
  assert.ok(result.metrics.counts.omit>=1);
  assert.ok(result.saved.id>0);
  const stored=db.prepare('SELECT * FROM speech_attempts WHERE id=?').get(result.saved.id);
  assert.equal(stored.context_type,'jw-reading');
  assert.ok(stored.expected_words>0);
  assert.equal(Object.hasOwn(stored,'transcript'),false);
});

test('speech overview and adaptive mastery evolve from recorded attempts',()=>{
  const db=openDatabase(':memory:');
  analyzeSpeech(db,{expected:'Quiero hablar español con claridad.',transcript:'Quiero hablar español con claridad.',contextType:'shadowing',durationMs:4500,audioStats:{}},NOW);
  analyzeSpeech(db,{expected:'Podemos practicar cada día.',transcript:'Podemos practicar día.',contextType:'shadowing',durationMs:5000,audioStats:{}},new Date(NOW.getTime()+60000));
  const o=speechOverview(db,30,new Date(NOW.getTime()+120000));
  assert.equal(o.count,2);
  assert.ok(o.averageAccuracy>0);
  assert.ok(o.skills.some(x=>x.skill_key==='text-correspondence'));
  assert.equal(o.recent.length,2);
});

test('speech target respects unassessed A1 gate',()=>{
  const db=openDatabase(':memory:');
  const shadow=nextSpeechTarget(db,'shadowing');
  const reading=nextSpeechTarget(db,'reading');
  assert.equal(shadow.level,'A1');
  assert.equal(reading.level,'A1');
  assert.ok(shadow.text.length>5);
  assert.ok(reading.text.length>5);
});

test('Whisper runtime is fail-closed when local binary or model is absent',()=>{
  const status=speechRuntimeStatus({SIDES_WHISPER_BIN:'/definitely/missing/whisper-cli',SIDES_WHISPER_MODEL:'/definitely/missing/model.bin'});
  assert.equal(status.ready,false);
  assert.equal(status.binaryReady,false);
  assert.equal(status.modelReady,false);
  assert.equal(piperStatus({}).ready,false);
});

test('Whisper adapter parses current full JSON and can be tested without executing a real model',async()=>{
  const parsed=parseWhisperJson({transcription:[{text:' Hola mundo.'},{text:' Estamos practicando.'}]});
  assert.equal(parsed.text,'Hola mundo. Estamos practicando.');
  const dir=mkdtempSync(join(tmpdir(),'sides-whisper-test-'));
  try{
    const bin=join(dir,process.platform==='win32'?'whisper-cli.exe':'whisper-cli'),model=join(dir,'ggml-base.bin');
    writeFileSync(bin,'x');writeFileSync(model,'x');
    const runner=async(_bin,args)=>{
      const out=args[args.indexOf('--output-file')+1];
      writeFileSync(`${out}.json`,JSON.stringify({transcription:[{text:' Hola desde prueba.'}]}));
      return {stdout:'',stderr:''};
    };
    const result=await transcribeWhisper(Buffer.alloc(100),{env:{SIDES_WHISPER_BIN:bin,SIDES_WHISPER_MODEL:model},runner});
    assert.equal(result.transcript,'Hola desde prueba.');
    assert.equal(result.engine,'whisper.cpp');
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('HTTP speech API supports manual comparison and backup stores metrics only',async()=>{
  const db=openDatabase(':memory:');
  const server=createSidesServer({db,now:()=>NOW});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try{
    const {port}=server.address(),base=`http://127.0.0.1:${port}`;
    const status=await fetch(`${base}/api/speech/status`).then(r=>r.json());
    assert.equal(status.whisper.engine,'whisper.cpp');
    const target=await fetch(`${base}/api/speech/target?kind=shadowing`).then(r=>r.json());
    assert.equal(target.item.level,'A1');
    const analyzed=await fetch(`${base}/api/speech/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected:'La práctica constante ayuda mucho.',transcript:'La práctica ayuda mucho.',contextType:'free',durationMs:5000,audioStats:{longPauses:1}})}).then(r=>r.json());
    assert.ok(analyzed.saved.id>0);
    const wrongType=await fetch(`${base}/api/speech/transcribe`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(wrongType.status,400);
    const backup=await fetch(`${base}/api/export`).then(r=>r.json());
    assert.equal(backup.schemaVersion,'SIDES-EXPORT-V7');
    assert.equal(backup.tables.speech_attempts.length,1);
    const row=backup.tables.speech_attempts[0];
    assert.equal(Object.keys(row).some(x=>/audio|blob|transcript|expected_text/i.test(x)),false);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
