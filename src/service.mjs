import { answerQuality, dailyQuest, levelFromXp, scheduleReview, selectInterleavedSession, xpForAttempt } from './learning.mjs';
import { getMeta, setMeta } from './db.mjs';

const pad2 = (n) => String(n).padStart(2,'0');
export const todayKey = (date = new Date()) => `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;

function ensureActivity(db, day = todayKey()) {
  db.prepare('INSERT OR IGNORE INTO activity(day) VALUES (?)').run(day);
  return db.prepare('SELECT * FROM activity WHERE day=?').get(day);
}

function totalStats(db) {
  return db.prepare(`SELECT COALESCE(SUM(xp),0) xp, COALESCE(SUM(attempts),0) attempts, COALESCE(SUM(correct),0) correct,
    COALESCE(SUM(minutes),0) minutes FROM activity`).get();
}

function streak(db, now = new Date()) {
  const days = new Set(db.prepare('SELECT day FROM activity WHERE attempts > 0 ORDER BY day DESC').all().map(x => x.day));
  let n = 0;
  const d = new Date(now);
  d.setHours(12,0,0,0);
  for (;;) {
    const key = todayKey(d);
    if (!days.has(key)) {
      if (n === 0) {
        d.setDate(d.getDate() - 1);
        const yesterday = todayKey(d);
        if (!days.has(yesterday)) return 0;
        n += 1;
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}


function computeAchievements({ total, currentStreak, correctRate }) {
  const defs = [
    ['primeiro-passo','Primeiro passo','Complete sua primeira atividade', total.attempts >= 1],
    ['ritmo-10','Em ritmo','Complete 10 atividades', total.attempts >= 10],
    ['centenario','Centenário','Complete 100 atividades', total.attempts >= 100],
    ['constancia-3','Constância','Estude por 3 dias seguidos', currentStreak >= 3],
    ['constancia-7','Semana firme','Estude por 7 dias seguidos', currentStreak >= 7],
    ['precisao-80','Precisão','Mantenha 80% de acerto após 25 atividades', total.attempts >= 25 && correctRate >= 80]
  ];
  return defs.map(([id,title,description,unlocked]) => ({id,title,description,unlocked}));
}

function updateMastery(db, { skillType, skillKey, correct, now }) {
  const type = String(skillType || 'general');
  const key = String(skillKey || 'general');
  const current = db.prepare('SELECT * FROM skill_mastery WHERE skill_type=? AND skill_key=?').get(type,key);
  const oldScore = current ? Number(current.score) : 0.5;
  const outcome = correct ? 1 : 0;
  const alpha = current && current.attempts >= 5 ? 0.18 : 0.28;
  const score = Math.max(0,Math.min(1,oldScore*(1-alpha)+outcome*alpha));
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(skill_type,skill_key) DO UPDATE SET
    attempts=skill_mastery.attempts+1,
    correct=skill_mastery.correct+excluded.correct,
    score=excluded.score,
    last_seen_at=excluded.last_seen_at`).run(type,key,1,correct?1:0,score,now.toISOString());
  return score;
}

function trackError(db,{itemType,itemId,skillKey,errorKind,correct,now}) {
  if (correct) {
    db.prepare('UPDATE error_log SET resolved_at=? WHERE item_type=? AND item_id=? AND resolved_at IS NULL')
      .run(now.toISOString(),itemType,itemId);
    return;
  }
  const existing=db.prepare('SELECT id FROM error_log WHERE item_type=? AND item_id=? AND resolved_at IS NULL ORDER BY id DESC LIMIT 1').get(itemType,itemId);
  if (!existing) db.prepare('INSERT INTO error_log(item_type,item_id,skill_key,error_kind,created_at) VALUES (?,?,?,?,?)')
    .run(itemType,itemId,String(skillKey||'general'),String(errorKind||'wrong'),now.toISOString());
}

export function learningInsights(db) {
  const weakest=db.prepare(`SELECT skill_type,skill_key,attempts,correct,ROUND(score*100) score
    FROM skill_mastery WHERE attempts>0 ORDER BY score ASC, attempts DESC LIMIT 5`).all();
  const openErrors=db.prepare('SELECT COUNT(*) n FROM error_log WHERE resolved_at IS NULL').get().n;
  return { weakestSkills: weakest, openErrors };
}

export function errorNotebook(db, limit=30) {
  return db.prepare(`SELECT id,item_type,item_id,skill_key,error_kind,created_at
    FROM error_log WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT ?`).all(Math.min(100,Math.max(1,Number(limit||30))));
}

export function dashboard(db, now = new Date()) {
  const day = ensureActivity(db, todayKey(now));
  const total = totalStats(db);
  const due = db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at <= ?').get(now.toISOString()).n;
  const correctRate = total.attempts ? Math.round(total.correct / total.attempts * 100) : 0;
  const quest = dailyQuest({ reviews: day.vocabulary, grammar: day.grammar, listening: day.listening, reading: day.reading });
  const currentStreak = streak(db, now);
  return {
    app: 'SIDES',
    placement: {
      completed: getMeta(db,'placementCompleted','false') === 'true',
      level: getMeta(db,'placementLevel','UNASSESSED')
    },
    preferences: { spanishVariant: getMeta(db,'spanishVariant','es') },
    today: day,
    total: { ...total, level: levelFromXp(total.xp), correctRate, streak: currentStreak },
    dueVocabulary: due,
    quest,
    achievements: computeAchievements({ total, currentStreak, correctRate }),
    insights: learningInsights(db)
  };
}

export function getVocabularyCard(db, now = new Date()) {
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel = level === 'UNASSESSED' ? 'A1' : level;
  const row = db.prepare(`SELECT v.*, s.due_at, s.interval_days, s.ease, s.reps, s.lapses
    FROM srs s JOIN vocabulary v ON v.id=s.item_id
    WHERE s.item_type='vocabulary' AND s.due_at <= ? AND v.level <= ?
    ORDER BY s.due_at ASC, s.reps ASC, v.id ASC LIMIT 1`).get(now.toISOString(),maxLevel);
  return row || null;
}

export function checkVocabulary(db, payload) {
  const id = Number(payload.id);
  const card = db.prepare('SELECT * FROM vocabulary WHERE id=?').get(id);
  if (!card) throw new Error('VOCABULARY_NOT_FOUND');
  const quality = answerQuality(payload.answer, card.spanish);
  return { quality, expected: card.spanish, example: card.example_es, translation: card.portuguese };
}

export function submitVocabulary(db, payload, now = new Date()) {
  const id = Number(payload.id);
  const card = db.prepare('SELECT * FROM vocabulary WHERE id=?').get(id);
  if (!card) throw new Error('VOCABULARY_NOT_FOUND');
  const quality = answerQuality(payload.answer, card.spanish);
  const rating = Number(payload.rating || (quality.score === 1 ? 3 : quality.score > 0 ? 2 : 1));
  const current = db.prepare('SELECT * FROM srs WHERE item_type=? AND item_id=?').get('vocabulary', id);
  const next = scheduleReview({
    intervalDays: current.interval_days,
    ease: current.ease,
    reps: current.reps,
    lapses: current.lapses
  }, rating, now);
  db.prepare(`UPDATE srs SET due_at=?, interval_days=?, ease=?, reps=?, lapses=?, last_review_at=?, scheduler=?
    WHERE item_type='vocabulary' AND item_id=?`).run(next.dueAt,next.intervalDays,next.ease,next.reps,next.lapses,next.lastReviewAt,next.scheduler,id);
  const currentStreak = streak(db, now);
  const xp = xpForAttempt({ correct: quality.score >= 0.8, mode:'vocabulary', rating, streak:currentStreak });
  recordAttempt(db,{itemType:'vocabulary',itemId:id,mode:'vocabulary',skillKey:card.tags||card.level,errorKind:quality.status,rating,correct:quality.score>=0.8,responseMs:Number(payload.responseMs||0),xp,now});
  return { quality, expected: card.spanish, example: card.example_es, translation: card.portuguese, nextDueAt: next.dueAt, intervalDays: next.intervalDays, xp };
}

export function randomGrammar(db) {
  const level = getMeta(db,'placementLevel','A1');
  return db.prepare(`SELECT * FROM grammar_exercises WHERE level <= ? ORDER BY RANDOM() LIMIT 1`).get(level === 'UNASSESSED' ? 'A1' : level) || db.prepare('SELECT * FROM grammar_exercises ORDER BY RANDOM() LIMIT 1').get();
}

export function submitGrammar(db, payload, now = new Date()) {
  const item = db.prepare('SELECT * FROM grammar_exercises WHERE id=?').get(Number(payload.id));
  if (!item) throw new Error('GRAMMAR_NOT_FOUND');
  const quality = answerQuality(payload.answer, JSON.parse(item.answers_json));
  const correct = quality.score >= 0.8;
  const xp = xpForAttempt({correct,mode:'grammar',rating:correct?3:1,streak:streak(db, now)});
  recordAttempt(db,{itemType:'grammar',itemId:item.id,mode:'grammar',skillKey:item.skill,errorKind:quality.status,rating:correct?3:1,correct,responseMs:Number(payload.responseMs||0),xp,now});
  return { quality, expected: JSON.parse(item.answers_json), explanation:item.explanation, xp };
}

export function randomListening(db) {
  const level = getMeta(db,'placementLevel','A1');
  return db.prepare('SELECT * FROM listening_items WHERE level <= ? ORDER BY RANDOM() LIMIT 1').get(level === 'UNASSESSED' ? 'A1' : level) || db.prepare('SELECT * FROM listening_items ORDER BY RANDOM() LIMIT 1').get();
}

export function submitListening(db, payload, now = new Date()) {
  const item = db.prepare('SELECT * FROM listening_items WHERE id=?').get(Number(payload.id));
  if (!item) throw new Error('LISTENING_NOT_FOUND');
  const quality = answerQuality(payload.answer, item.text);
  const correct = quality.score >= 0.8;
  const xp = xpForAttempt({correct,mode:'listening',rating:correct?3:1,streak:streak(db, now)});
  recordAttempt(db,{itemType:'listening',itemId:item.id,mode:'listening',skillKey:`listening-${item.level}`,errorKind:quality.status,rating:correct?3:1,correct,responseMs:Number(payload.responseMs||0),xp,now});
  return { quality, expected:item.text, translation:item.translation, xp };
}

export function randomReading(db) {
  const level = getMeta(db,'placementLevel','A1');
  const item = db.prepare('SELECT * FROM reading_texts WHERE level <= ? ORDER BY RANDOM() LIMIT 1').get(level === 'UNASSESSED' ? 'A1' : level) || db.prepare('SELECT * FROM reading_texts ORDER BY RANDOM() LIMIT 1').get();
  if (!item) return null;
  return { ...item, questions: JSON.parse(item.questions_json).map((q,i)=>({index:i,q:q.q})) };
}

export function submitReading(db, payload, now = new Date()) {
  const item = db.prepare('SELECT * FROM reading_texts WHERE id=?').get(Number(payload.id));
  if (!item) throw new Error('READING_NOT_FOUND');
  const questions = JSON.parse(item.questions_json);
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const details = questions.map((q,i)=>({q:q.q,...answerQuality(answers[i],q.answers), expected:q.answers}));
  const correct = details.filter(x=>x.score>=0.8).length;
  const isCorrect = correct >= Math.ceil(questions.length*0.7);
  const xp = xpForAttempt({correct:isCorrect,mode:'reading',rating:isCorrect?3:1,streak:streak(db, now)});
  recordAttempt(db,{itemType:'reading',itemId:item.id,mode:'reading',skillKey:`reading-${item.level}`,errorKind:isCorrect?'correct':'comprehension',rating:isCorrect?3:1,correct:isCorrect,responseMs:Number(payload.responseMs||0),xp,now});
  return { correct, total:questions.length, details, xp };
}

export function placementItems(db) {
  return db.prepare('SELECT id,level,prompt,options_json FROM placement_items ORDER BY id').all().map(x=>({...x,options:JSON.parse(x.options_json)}));
}

export function submitPlacement(db, payload, now = new Date()) {
  const given = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};
  const items = db.prepare('SELECT * FROM placement_items ORDER BY id').all();
  const scoreByLevel = {A1:[0,0],A2:[0,0],B1:[0,0],B2:[0,0]};
  for (const item of items) {
    const correct = answerQuality(given[item.id], JSON.parse(item.answers_json)).score >= 0.8;
    scoreByLevel[item.level][1] += 1;
    if (correct) scoreByLevel[item.level][0] += 1;
  }
  let level = 'A1';
  if (scoreByLevel.A1[0] >= 2 && scoreByLevel.A2[0] >= 2) level='A2';
  if (scoreByLevel.A1[0] >= 2 && scoreByLevel.A2[0] >= 2 && scoreByLevel.B1[0] >= 2) level='B1';
  if (scoreByLevel.A1[0] >= 2 && scoreByLevel.A2[0] >= 2 && scoreByLevel.B1[0] >= 2 && scoreByLevel.B2[0] >= 2) level='B2';
  setMeta(db,'placementLevel',level);
  setMeta(db,'placementCompleted','true');
  const correct = Object.values(scoreByLevel).reduce((s,[c])=>s+c,0);
  const xp = Math.min(50, correct*4);
  ensureActivity(db,todayKey(now));
  db.prepare('UPDATE activity SET xp=xp+?, attempts=attempts+?, correct=correct+? WHERE day=?').run(xp,items.length,correct,todayKey(now));
  return { level, scoreByLevel, correct, total:items.length, xp };
}

export function updatePreferences(db, payload = {}) {
  const allowed = new Set(['es','es-ES','es-MX','es-AR']);
  const spanishVariant = String(payload.spanishVariant || 'es');
  if (!allowed.has(spanishVariant)) throw new Error('SPANISH_VARIANT_INVALID');
  setMeta(db,'spanishVariant',spanishVariant);
  return { spanishVariant };
}

export function dailySession(db, limit=20) {
  const now = new Date().toISOString();
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel = level === 'UNASSESSED' ? 'A1' : level;
  const dueVocabulary = db.prepare(`SELECT v.id,v.spanish,v.portuguese,v.example_es,v.level FROM srs s JOIN vocabulary v ON v.id=s.item_id WHERE s.item_type='vocabulary' AND s.due_at<=? AND v.level<=? ORDER BY s.due_at LIMIT 30`).all(now,maxLevel);
  const grammar = db.prepare(`SELECT g.id,g.prompt,g.level,g.skill
    FROM grammar_exercises g
    LEFT JOIN skill_mastery m ON m.skill_type='grammar' AND m.skill_key=g.skill
    WHERE g.level <= ?
    ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type='grammar' AND e.item_id=g.id AND e.resolved_at IS NULL) DESC,
      COALESCE(m.score,0.5) ASC, RANDOM() LIMIT 6`).all(maxLevel);
  const listening = db.prepare(`SELECT l.id,l.text,l.level
    FROM listening_items l
    LEFT JOIN skill_mastery m ON m.skill_type='listening' AND m.skill_key=('listening-' || l.level)
    WHERE l.level <= ?
    ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type='listening' AND e.item_id=l.id AND e.resolved_at IS NULL) DESC,
      COALESCE(m.score,0.5) ASC, RANDOM() LIMIT 4`).all(maxLevel);
  const reading = db.prepare(`SELECT r.id,r.title,r.level
    FROM reading_texts r
    LEFT JOIN skill_mastery m ON m.skill_type='reading' AND m.skill_key=('reading-' || r.level)
    WHERE r.level <= ?
    ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type='reading' AND e.item_id=r.id AND e.resolved_at IS NULL) DESC,
      COALESCE(m.score,0.5) ASC, RANDOM() LIMIT 2`).all(maxLevel);
  return selectInterleavedSession({dueVocabulary,grammar,listening,reading,limit});
}

function recordAttempt(db,{itemType,itemId,mode,skillKey='general',errorKind='wrong',rating,correct,responseMs,xp,now}) {
  db.prepare('INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(itemType,itemId,mode,rating,correct?1:0,responseMs,xp,now.toISOString());
  const day = todayKey(now);
  ensureActivity(db,day);
  const allowed = new Set(['vocabulary','grammar','listening','reading','speaking']);
  const column = allowed.has(mode) ? mode : 'vocabulary';
  db.prepare(`UPDATE activity SET xp=xp+?, attempts=attempts+1, correct=correct+?, ${column}=${column}+1 WHERE day=?`).run(xp,correct?1:0,day);
  updateMastery(db,{skillType:mode,skillKey,correct,now});
  trackError(db,{itemType,itemId,skillKey,errorKind,correct,now});
}

export function completeSpeaking(db, payload, now = new Date()) {
  const itemId = Number(payload.id || 0);
  const effort = Math.max(1, Math.min(4, Number(payload.effort || 3)));
  const xp = xpForAttempt({correct:true,mode:'speaking',rating:effort,streak:streak(db, now)});
  recordAttempt(db,{itemType:'speaking',itemId,mode:'speaking',skillKey:'shadowing',errorKind:'self_assessed',rating:effort,correct:true,responseMs:Number(payload.responseMs||0),xp,now});
  return {xp};
}

export function exportData(db) {
  const tables = ['meta','vocabulary','srs','reviews','activity','skill_mastery','error_log'];
  const out = { schemaVersion:'SIDES-EXPORT-V1', exportedAt:new Date().toISOString(), tables:{} };
  for (const table of tables) out.tables[table] = db.prepare(`SELECT * FROM ${table}`).all();
  return out;
}
