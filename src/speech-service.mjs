import { speechGuidance, speechMetrics } from './speech-align.mjs';
import { speechRuntimeStatus } from './speech-runtime.mjs';

const CONTEXTS=new Set(['shadowing','reading','free','jw-reading','jw-comment','jw-talk','assignment']);
const LEVELS=['A1','A2','B1','B2'];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const pad2=n=>String(n).padStart(2,'0');
const localDay=date=>`${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
const meta=(db,key,fallback)=>db.prepare('SELECT value FROM meta WHERE key=?').get(key)?.value??fallback;

export function ensureSpeechSchema(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS speech_attempts(
      id INTEGER PRIMARY KEY,
      context_type TEXT NOT NULL,
      context_id INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      expected_words INTEGER NOT NULL DEFAULT 0,
      recognized_words INTEGER NOT NULL DEFAULT 0,
      correct_words INTEGER NOT NULL DEFAULT 0,
      omissions INTEGER NOT NULL DEFAULT 0,
      additions INTEGER NOT NULL DEFAULT 0,
      substitutions INTEGER NOT NULL DEFAULT 0,
      accent_differences INTEGER NOT NULL DEFAULT 0,
      accuracy INTEGER NOT NULL DEFAULT 0,
      strict_accuracy INTEGER NOT NULL DEFAULT 0,
      wpm INTEGER NOT NULL DEFAULT 0,
      pause_count INTEGER NOT NULL DEFAULT 0,
      long_pauses INTEGER NOT NULL DEFAULT 0,
      max_pause_ms INTEGER NOT NULL DEFAULT 0,
      total_silence_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_speech_attempts_time ON speech_attempts(created_at,context_type);
  `);
  db.prepare("INSERT INTO meta(key,value) VALUES ('speechSchemaVersion','SIDES-SPEECH-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-SPEECH-V1'").run();
}

function updateSkill(db,key,score,now){
  const outcome=clamp(Number(score||0),0,1),correct=outcome>=0.7;
  const current=db.prepare("SELECT * FROM skill_mastery WHERE skill_type='speech' AND skill_key=?").get(key);
  const old=current?Number(current.score):0.5,alpha=current&&current.attempts>=5?0.18:0.28;
  const next=clamp(old*(1-alpha)+outcome*alpha,0,1);
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at)
    VALUES ('speech',?,?,?,?,?) ON CONFLICT(skill_type,skill_key) DO UPDATE SET attempts=skill_mastery.attempts+1,
    correct=skill_mastery.correct+excluded.correct,score=excluded.score,last_seen_at=excluded.last_seen_at`)
    .run(key,1,correct?1:0,next,now.toISOString());
  db.prepare("INSERT INTO skill_events(skill_type,skill_key,correct,score_after,created_at) VALUES ('speech',?,?,?,?)")
    .run(key,correct?1:0,next,now.toISOString());
}

function record(db,payload,metrics,now){
  ensureSpeechSchema(db);
  const contextType=CONTEXTS.has(payload.contextType)?payload.contextType:'free';
  const contextId=Math.max(0,Number(payload.contextId||0));
  const durationMs=Math.max(0,Number(payload.durationMs||payload.audioStats?.durationMs||0));
  const result=db.prepare(`INSERT INTO speech_attempts(context_type,context_id,duration_ms,expected_words,recognized_words,correct_words,
    omissions,additions,substitutions,accent_differences,accuracy,strict_accuracy,wpm,pause_count,long_pauses,max_pause_ms,total_silence_ms,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(contextType,contextId,durationMs,metrics.expectedWords,metrics.recognizedWords,metrics.correctWords,
      metrics.counts.omit,metrics.counts.add,metrics.counts.substitute,metrics.counts.accent,metrics.accuracy,metrics.strictAccuracy,metrics.wpm,
      metrics.pauseCount,metrics.longPauses,metrics.maxPauseMs,metrics.totalSilenceMs,now.toISOString());
  updateSkill(db,'text-correspondence',metrics.accuracy/100,now);
  updateSkill(db,'omissions',metrics.expectedWords?1-metrics.counts.omit/metrics.expectedWords:0,now);
  updateSkill(db,'substitutions',metrics.expectedWords?1-metrics.counts.substitute/metrics.expectedWords:0,now);
  updateSkill(db,'fluency-pauses',metrics.longPauses<=1?1:metrics.longPauses<=3?0.7:0.35,now);
  if(metrics.wpm>0)updateSkill(db,'pace',metrics.wpm>=65&&metrics.wpm<=180?1:metrics.wpm>=50&&metrics.wpm<=200?0.7:0.4,now);
  const day=localDay(now);
  db.prepare('INSERT OR IGNORE INTO activity(day) VALUES (?)').run(day);
  const xp=clamp(6+Math.round(metrics.accuracy/20)+(metrics.longPauses<=2?2:0),6,14);
  db.prepare('UPDATE activity SET xp=xp+?,attempts=attempts+1,correct=correct+?,speaking=speaking+1,minutes=minutes+? WHERE day=?')
    .run(xp,metrics.accuracy>=70?1:0,Math.max(0,Math.round(durationMs/60000)),day);
  return {id:Number(result.lastInsertRowid),xp};
}

export function analyzeSpeech(db,payload={},now=new Date()){
  const expected=String(payload.expected||'').trim(),recognized=String(payload.transcript||'').trim();
  if(!expected||expected.length>8000)throw new Error('SPEECH_EXPECTED_INVALID');
  if(!recognized||recognized.length>8000)throw new Error('SPEECH_TRANSCRIPT_INVALID');
  const contextType=CONTEXTS.has(String(payload.contextType))?String(payload.contextType):'free';
  const metrics=speechMetrics({expected,recognized,durationMs:Number(payload.durationMs||payload.audioStats?.durationMs||0),audioStats:payload.audioStats||{}});
  const saved=record(db,{...payload,contextType},metrics,now);
  return {transcript:recognized,metrics,guidance:speechGuidance(metrics),saved,notice:'Indicadores de inteligibilidade e correspondência textual; não são medição fonética ou diagnóstico de sotaque.'};
}

export function nextSpeechTarget(db,kind='shadowing'){
  const level=meta(db,'placementLevel','A1');
  const max=level==='UNASSESSED'?'A1':LEVELS.includes(level)?level:'A1';
  const safeKind=kind==='reading'?'reading':'shadowing';
  if(safeKind==='shadowing'){
    const row=db.prepare('SELECT id,text,translation,level FROM listening_items WHERE level<=? ORDER BY RANDOM() LIMIT 1').get(max);
    return row?{id:row.id,kind:'shadowing',level:row.level,text:row.text,translation:row.translation}:null;
  }
  const row=db.prepare('SELECT id,title,body,level FROM reading_texts WHERE level<=? ORDER BY RANDOM() LIMIT 1').get(max);
  if(!row)return null;
  const text=String(row.body).split(/(?<=[.!?])\s+/u).slice(0,2).join(' ').slice(0,900);
  return {id:row.id,kind:'reading',level:row.level,title:row.title,text};
}

export function speechOverview(db,days=30,now=new Date()){
  ensureSpeechSchema(db);
  const safeDays=clamp(Number(days||30),7,180),since=new Date(now.getTime()-safeDays*86400000).toISOString();
  const rows=db.prepare('SELECT * FROM speech_attempts WHERE created_at>=? ORDER BY created_at DESC LIMIT 100').all(since);
  const avg=key=>rows.length?Math.round(rows.reduce((s,x)=>s+Number(x[key]||0),0)/rows.length):0;
  const skills=db.prepare("SELECT skill_key,attempts,ROUND(score*100) score,last_seen_at FROM skill_mastery WHERE skill_type='speech' ORDER BY score ASC,attempts DESC").all();
  return {days:safeDays,count:rows.length,averageAccuracy:avg('accuracy'),averageWpm:avg('wpm'),averageLongPauses:avg('long_pauses'),skills,
    recent:rows.slice(0,12).map(x=>({id:x.id,contextType:x.context_type,durationMs:x.duration_ms,accuracy:x.accuracy,wpm:x.wpm,omissions:x.omissions,substitutions:x.substitutions,longPauses:x.long_pauses,createdAt:x.created_at})),runtime:speechRuntimeStatus()};
}
