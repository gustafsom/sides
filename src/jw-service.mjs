import { answerQuality, xpForAttempt } from './learning.mjs';
import { bibleBooks, jwVocabulary, officialJwResources, speakingRubrics } from './jw-content.mjs';
import { todayKey } from './service.mjs';

function ensureActivity(db, day) {
  db.prepare('INSERT OR IGNORE INTO activity(day) VALUES (?)').run(day);
}

function updateMastery(db,{skillType,skillKey,correct,now,weight=1}) {
  const current=db.prepare('SELECT * FROM skill_mastery WHERE skill_type=? AND skill_key=?').get(skillType,skillKey);
  const oldScore=current?Number(current.score):0.5;
  const alpha=(current&&current.attempts>=5?0.18:0.28)*Math.max(0.25,Math.min(1,weight));
  const score=Math.max(0,Math.min(1,oldScore*(1-alpha)+(correct?1:0)*alpha));
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(skill_type,skill_key) DO UPDATE SET
    attempts=skill_mastery.attempts+1,
    correct=skill_mastery.correct+excluded.correct,
    score=excluded.score,
    last_seen_at=excluded.last_seen_at`).run(skillType,skillKey,1,correct?1:0,score,now.toISOString());
  return score;
}

function recordError(db,{itemType,itemId,skillKey,errorKind,correct,now}) {
  if(correct){
    db.prepare('UPDATE error_log SET resolved_at=? WHERE item_type=? AND item_id=? AND resolved_at IS NULL').run(now.toISOString(),itemType,itemId);
    return;
  }
  const open=db.prepare('SELECT id FROM error_log WHERE item_type=? AND item_id=? AND resolved_at IS NULL LIMIT 1').get(itemType,itemId);
  if(!open)db.prepare('INSERT INTO error_log(item_type,item_id,skill_key,error_kind,created_at) VALUES (?,?,?,?,?)').run(itemType,itemId,skillKey,errorKind,now.toISOString());
}

function recordAttempt(db,{itemType,itemId,mode,skillKey,correct,rating=3,responseMs=0,xp,now,errorKind='wrong'}) {
  db.prepare('INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(itemType,itemId,mode,rating,correct?1:0,responseMs,xp,now.toISOString());
  const day=todayKey(now);ensureActivity(db,day);
  const column=mode==='listening'?'listening':mode==='reading'?'reading':mode==='speaking'?'speaking':'vocabulary';
  db.prepare(`UPDATE activity SET xp=xp+?, attempts=attempts+1, correct=correct+?, ${column}=${column}+1 WHERE day=?`).run(xp,correct?1:0,day);
  updateMastery(db,{skillType:'jw',skillKey,correct,now});
  recordError(db,{itemType,itemId,skillKey,errorKind,correct,now});
}

function weakestCategory(db) {
  const scores=new Map(db.prepare("SELECT skill_key,score FROM skill_mastery WHERE skill_type='jw'").all().map(x=>[x.skill_key,Number(x.score)]));
  const categories=[...new Set(jwVocabulary.map(x=>`vocab:${x.category}`))];
  return categories.sort((a,b)=>(scores.get(a)??0.5)-(scores.get(b)??0.5))[0];
}

export function jwOverview(db) {
  const openErrors=db.prepare("SELECT COUNT(*) n FROM error_log WHERE item_type LIKE 'jw-%' AND resolved_at IS NULL").get().n;
  const mastery=db.prepare("SELECT skill_key,attempts,correct,ROUND(score*100) score FROM skill_mastery WHERE skill_type='jw' ORDER BY score ASC,attempts DESC LIMIT 8").all();
  return {
    vocabularyCount:jwVocabulary.length,
    bibleBooksCount:bibleBooks.length,
    openErrors,
    weakest:mastery,
    rubrics:speakingRubrics,
    resources:officialJwResources,
    copyrightBoundary:'SIDES does not copy or cache JW.ORG publication or Bible text. Official content remains on JW.ORG/JW Library.'
  };
}

export function nextJwVocabulary(db) {
  const open=db.prepare("SELECT item_id FROM error_log WHERE item_type='jw-vocabulary' AND resolved_at IS NULL ORDER BY created_at ASC LIMIT 1").get();
  if(open){const item=jwVocabulary.find(x=>x.id===Number(open.item_id));if(item)return item;}
  const weakest=weakestCategory(db).replace('vocab:','');
  const candidates=jwVocabulary.filter(x=>x.category===weakest);
  return candidates[Math.floor(Math.random()*candidates.length)]||jwVocabulary[Math.floor(Math.random()*jwVocabulary.length)];
}

export function submitJwVocabulary(db,payload,now=new Date()) {
  const item=jwVocabulary.find(x=>x.id===Number(payload.id));
  if(!item)throw new Error('JW_VOCABULARY_NOT_FOUND');
  const quality=answerQuality(payload.answer,item.es);
  const correct=quality.score>=0.8;
  const rating=Number(payload.rating||(correct?3:1));
  const xp=xpForAttempt({correct,mode:'vocabulary',rating});
  recordAttempt(db,{itemType:'jw-vocabulary',itemId:item.id,mode:'vocabulary',skillKey:`vocab:${item.category}`,correct,rating,responseMs:Number(payload.responseMs||0),xp,now,errorKind:quality.status});
  return {quality,expected:item.es,translation:item.pt,example:item.example,category:item.category,xp};
}

export function nextBibleBook(db) {
  const item=bibleBooks[Math.floor(Math.random()*bibleBooks.length)];
  const modes=['pt-to-es','abbr-to-name','es-to-abbr'];
  const mode=modes[Math.floor(Math.random()*modes.length)];
  if(mode==='pt-to-es')return {id:item.id,mode,prompt:item.pt,expectedType:'Nombre en español'};
  if(mode==='abbr-to-name')return {id:item.id,mode,prompt:item.abbr,expectedType:'Libro completo'};
  return {id:item.id,mode,prompt:item.es,expectedType:'Abreviatura'};
}

export function submitBibleBook(db,payload,now=new Date()) {
  const item=bibleBooks.find(x=>x.id===Number(payload.id));
  if(!item)throw new Error('JW_BIBLE_BOOK_NOT_FOUND');
  const expected=payload.mode==='pt-to-es'?item.es:payload.mode==='abbr-to-name'?item.es:item.abbr;
  const quality=answerQuality(payload.answer,expected);
  const correct=quality.score>=0.8;
  const xp=xpForAttempt({correct,mode:'vocabulary',rating:correct?3:1});
  recordAttempt(db,{itemType:'jw-bible-book',itemId:item.id,mode:'vocabulary',skillKey:'bible-books',correct,rating:correct?3:1,responseMs:Number(payload.responseMs||0),xp,now,errorKind:quality.status});
  return {quality,expected,book:item.es,portuguese:item.pt,abbreviation:item.abbr,xp};
}

export function completeJwSpeaking(db,payload,now=new Date()) {
  const practiceType=String(payload.practiceType||'reading');
  if(!new Set(['reading','comment','talk']).has(practiceType))throw new Error('JW_PRACTICE_TYPE_INVALID');
  const ratings=payload.ratings&&typeof payload.ratings==='object'?payload.ratings:{};
  const validRatings=speakingRubrics.map(r=>Number(ratings[r.id]||0)).filter(x=>x>=1&&x<=5);
  const average=validRatings.length?validRatings.reduce((a,b)=>a+b,0)/validRatings.length:3;
  const correct=average>=3;
  const xp=xpForAttempt({correct:true,mode:'speaking',rating:Math.max(1,Math.min(4,Math.round(average*0.8)))});
  recordAttempt(db,{itemType:`jw-${practiceType}`,itemId:0,mode:'speaking',skillKey:`speaking:${practiceType}`,correct,rating:Math.max(1,Math.min(4,Math.round(average*0.8))),responseMs:Number(payload.durationMs||0),xp,now,errorKind:correct?'self-assessed-ok':'self-assessed-review'});
  for(const rubric of speakingRubrics){
    const value=Number(ratings[rubric.id]||0);if(value<1||value>5)continue;
    updateMastery(db,{skillType:'jw',skillKey:`rubric:${rubric.id}`,correct:value>=3,now,weight:0.65});
  }
  return {xp,average:Number(average.toFixed(1)),practiceType};
}

export function jwSessionPlan() {
  return [
    {kind:'jw-vocabulary',label:'5 palavras de vocabulário'},
    {kind:'jw-bible-book',label:'5 livros/abreviações da Bíblia'},
    {kind:'jw-reading',label:'1 leitura pública com gravação'},
    {kind:'jw-comment',label:'1 comentário de 30–60 segundos'},
    {kind:'jw-talk',label:'1 trecho de discurso de 2–3 minutos'}
  ];
}
