import { answerQuality, dailyQuest, levelFromXp, selectInterleavedSession, xpForAttempt } from './learning.mjs';
import { getMeta, setMeta } from './db.mjs';
import { attentionReport, guidanceFor, progressDashboard as buildProgressDashboard } from './attention.mjs';
import { scheduleFsrs } from './fsrs-adapter.mjs';
import { curriculumMeta, curriculumOverview, prerequisiteReadiness, rankByReadiness } from './curriculum.mjs';

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
  db.prepare('INSERT INTO skill_events(skill_type,skill_key,correct,score_after,created_at) VALUES (?,?,?,?,?)')
    .run(type,key,correct?1:0,score,now.toISOString());
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

function recordAttempt(db,{itemType,itemId,mode,skillType=mode,skillKey='general',errorKind='wrong',rating,correct,responseMs,xp,now}) {
  db.prepare('INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(itemType,itemId,mode,rating,correct?1:0,responseMs,xp,now.toISOString());
  const day = todayKey(now);
  ensureActivity(db,day);
  const allowed = new Set(['vocabulary','grammar','listening','reading','speaking']);
  const column = allowed.has(mode) ? mode : 'vocabulary';
  db.prepare(`UPDATE activity SET xp=xp+?, attempts=attempts+1, correct=correct+?, ${column}=${column}+1 WHERE day=?`).run(xp,correct?1:0,day);
  updateMastery(db,{skillType,skillKey,correct,now});
  trackError(db,{itemType,itemId,skillKey,errorKind,correct,now});
}

function applyFsrsReview(db,itemType,itemId,current,rating,now) {
  const next=scheduleFsrs(current,rating,now);
  db.prepare(`UPDATE srs SET due_at=?,interval_days=?,reps=?,lapses=?,last_review_at=?,scheduler=?,
    stability=?,difficulty=?,elapsed_days=?,scheduled_days=?,learning_steps=?,state=? WHERE item_type=? AND item_id=?`)
    .run(next.dueAt,next.intervalDays,next.reps,next.lapses,next.lastReviewAt,next.scheduler,
      next.stability,next.difficulty,next.elapsedDays,next.scheduledDays,next.learningSteps,next.state,itemType,itemId);
  return next;
}

function reviewPressure(db,now=new Date()) {
  const reviewedDue=Number(db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at<=? AND reps>0').get(now.toISOString()).n);
  return {reviewedDue,freezeNew:reviewedDue>=30};
}

function attachCurriculum(db,itemType,row) {
  if(!row)return null;
  const meta=curriculumMeta(db,itemType,row.id);
  return meta?{...row,curriculum:{level:meta.level,topic:meta.topic,difficulty:meta.difficulty,prerequisites:meta.prerequisites,readiness:Number(prerequisiteReadiness(db,itemType,row.id).toFixed(2))}}:row;
}

function chooseCandidate(db,itemType,rows) {
  if(!rows.length)return null;
  const reviewed=rows.filter(x=>Number(x.reps||0)>0);
  if(reviewed.length)return attachCurriculum(db,itemType,reviewed[0]);
  return attachCurriculum(db,itemType,rankByReadiness(db,itemType,rows)[0]);
}

function vocabularyHelp(card,quality) {
  if(quality.status==='correct') return null;
  if(quality.status==='accent') return {
    title:'A forma está quase correta',
    explanation:`A palavra esperada é “${card.spanish}”. Em espanhol, o acento gráfico pode distinguir a forma correta e deve entrar na memória junto com a palavra.`,
    example:card.example_es,
    tip:'Digite novamente a palavra correta uma vez, sem copiar.'
  };
  return {
    title:`Fixe “${card.spanish}” em contexto`,
    explanation:`Para “${card.portuguese}”, a forma trabalhada neste item é “${card.spanish}”. Evite decorar apenas a tradução: recupere a expressão dentro da frase.`,
    example:card.example_es,
    tip:'Leia o exemplo, esconda a resposta e produza uma frase curta com a palavra.'
  };
}

function listeningHelp(item,quality) {
  if(quality.status==='correct') return null;
  return {
    title:quality.status==='accent'?'Você entendeu o áudio; revise a grafia':'Compare som e texto em blocos curtos',
    explanation:'No ditado, o erro pode vir de segmentação das palavras, redução sonora, vocabulário ainda não automático ou grafia. Compare a sua resposta com o texto por pequenos grupos de palavras.',
    example:item.text,
    tip:'Ouça novamente em 0,75×, repita em voz alta e depois escute em 1× sem olhar o texto.'
  };
}

export function learningInsights(db,now=new Date()) {
  const weakest=db.prepare(`SELECT skill_type,skill_key,attempts,correct,ROUND(score*100) score
    FROM skill_mastery WHERE attempts>0 ORDER BY score ASC, attempts DESC LIMIT 5`).all();
  const openErrors=db.prepare('SELECT COUNT(*) n FROM error_log WHERE resolved_at IS NULL').get().n;
  return { weakestSkills: weakest, openErrors, attention:attentionReport(db,now,5) };
}

export function errorNotebook(db, limit=30) {
  return db.prepare(`SELECT id,item_type,item_id,skill_key,error_kind,created_at
    FROM error_log WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT ?`).all(Math.min(100,Math.max(1,Number(limit||30))));
}

export function curriculumStatus(db) {
  return curriculumOverview(db);
}

export function dashboard(db, now = new Date()) {
  const day = ensureActivity(db, todayKey(now));
  const total = totalStats(db);
  const dueVocabulary = db.prepare("SELECT COUNT(*) n FROM srs WHERE item_type='vocabulary' AND due_at <= ?").get(now.toISOString()).n;
  const dueTotal = db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at <= ?').get(now.toISOString()).n;
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
    dueVocabulary:Number(dueVocabulary),
    dueTotal:Number(dueTotal),
    reviewPressure:reviewPressure(db,now),
    quest,
    achievements: computeAchievements({ total, currentStreak, correctRate }),
    insights: learningInsights(db,now),
    curriculum:curriculumOverview(db)
  };
}

export function progressDashboard(db,now=new Date(),days=30) {
  return buildProgressDashboard(db,now,days);
}

export function getVocabularyCard(db, now = new Date()) {
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel = level === 'UNASSESSED' ? 'A1' : level;
  const pressure=reviewPressure(db,now);
  const rows = db.prepare(`SELECT v.*, s.*
    FROM srs s JOIN vocabulary v ON v.id=s.item_id
    WHERE s.item_type='vocabulary' AND s.due_at <= ? AND v.level <= ? ${pressure.freezeNew?'AND s.reps>0':''}
    ORDER BY s.due_at ASC, s.reps DESC, v.id ASC LIMIT 25`).all(now.toISOString(),maxLevel);
  return chooseCandidate(db,'vocabulary',rows);
}

export function checkVocabulary(db, payload) {
  const id = Number(payload.id);
  const card = db.prepare('SELECT * FROM vocabulary WHERE id=?').get(id);
  if (!card) throw new Error('VOCABULARY_NOT_FOUND');
  const quality = answerQuality(payload.answer, card.spanish);
  return { quality, expected: card.spanish, example: card.example_es, translation: card.portuguese, help:vocabularyHelp(card,quality) };
}

export function submitVocabulary(db, payload, now = new Date()) {
  const id = Number(payload.id);
  const card = db.prepare('SELECT * FROM vocabulary WHERE id=?').get(id);
  if (!card) throw new Error('VOCABULARY_NOT_FOUND');
  const quality = answerQuality(payload.answer, card.spanish);
  const rating = Number(payload.rating || (quality.score === 1 ? 3 : quality.score > 0 ? 2 : 1));
  const current = db.prepare('SELECT * FROM srs WHERE item_type=? AND item_id=?').get('vocabulary', id);
  const next = applyFsrsReview(db,'vocabulary',id,current,rating,now);
  const currentStreak = streak(db, now);
  const correct=quality.score>=0.8;
  const xp = xpForAttempt({ correct, mode:'vocabulary', rating, streak:currentStreak });
  const meta=curriculumMeta(db,'vocabulary',id);
  recordAttempt(db,{itemType:'vocabulary',itemId:id,mode:'vocabulary',skillType:'vocabulary',skillKey:meta?.topic||card.tags||card.level,errorKind:quality.status,rating,correct,responseMs:Number(payload.responseMs||0),xp,now});
  return { quality, expected: card.spanish, example: card.example_es, translation: card.portuguese, help:vocabularyHelp(card,quality), nextDueAt: next.dueAt, intervalDays: next.intervalDays, scheduler:next.scheduler, xp };
}

export function nextLearningItem(db,kind='chunk',now=new Date(),skill=null) {
  const safeKind=new Set(['chunk','contrast']).has(kind)?kind:'chunk';
  const level=getMeta(db,'placementLevel','A1');
  const maxLevel=level==='UNASSESSED'?'A1':level;
  const pressure=reviewPressure(db,now);
  const row=db.prepare(`SELECT l.id,l.kind,l.level,l.skill,l.prompt,l.tags,s.due_at,s.reps
    FROM learning_items l JOIN srs s ON s.item_type=l.kind AND s.item_id=l.id
    WHERE l.kind=? AND l.level<=? AND s.due_at<=? ${skill?'AND l.skill=?':''} ${pressure.freezeNew?'AND s.reps>0':''}
    ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type=l.kind AND e.item_id=l.id AND e.resolved_at IS NULL) DESC,
      s.due_at ASC,s.reps DESC,l.id ASC LIMIT 30`);
  const args=skill?[safeKind,maxLevel,now.toISOString(),String(skill)]:[safeKind,maxLevel,now.toISOString()];
  const rows=row.all(...args);
  return chooseCandidate(db,safeKind,rows);
}

export function submitLearningItem(db,payload,now=new Date()) {
  const id=Number(payload.id),kind=String(payload.kind||'chunk');
  if(!new Set(['chunk','contrast']).has(kind))throw new Error('LEARNING_KIND_INVALID');
  const item=db.prepare('SELECT * FROM learning_items WHERE id=? AND kind=?').get(id,kind);
  if(!item)throw new Error('LEARNING_ITEM_NOT_FOUND');
  const expected=[item.answer,...JSON.parse(item.alternatives_json||'[]')];
  const quality=answerQuality(payload.answer,expected);
  const correct=quality.score>=0.8;
  const rating=Number(payload.rating||(quality.score===1?3:quality.score>0?2:1));
  const current=db.prepare('SELECT * FROM srs WHERE item_type=? AND item_id=?').get(kind,id);
  const next=applyFsrsReview(db,kind,id,current,rating,now);
  const xp=xpForAttempt({correct,mode:'vocabulary',rating,streak:streak(db,now)});
  recordAttempt(db,{itemType:kind,itemId:id,mode:'vocabulary',skillType:kind,skillKey:item.skill,errorKind:quality.status,rating,correct,responseMs:Number(payload.responseMs||0),xp,now});
  return {
    quality,expected:item.answer,alternatives:JSON.parse(item.alternatives_json||'[]'),explanation:item.explanation,example:item.example,
    guidance:guidanceFor(kind,item.skill),nextDueAt:next.dueAt,intervalDays:next.intervalDays,scheduler:next.scheduler,xp
  };
}

export function randomGrammar(db,skill=null) {
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel=level === 'UNASSESSED' ? 'A1' : level;
  let rows;
  if(skill){
    rows=db.prepare(`SELECT * FROM grammar_exercises WHERE level<=? AND skill=? ORDER BY RANDOM() LIMIT 30`).all(maxLevel,String(skill));
  }else{
    rows=db.prepare(`SELECT g.* FROM grammar_exercises g
      LEFT JOIN skill_mastery m ON m.skill_type='grammar' AND m.skill_key=g.skill
      WHERE g.level<=?
      ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type='grammar' AND e.item_id=g.id AND e.resolved_at IS NULL) DESC,
        COALESCE(m.score,0.5) ASC,RANDOM() LIMIT 30`).all(maxLevel);
  }
  const picked=rankByReadiness(db,'grammar',rows)[0]||db.prepare('SELECT * FROM grammar_exercises ORDER BY RANDOM() LIMIT 1').get();
  return attachCurriculum(db,'grammar',picked);
}

export function submitGrammar(db, payload, now = new Date()) {
  const item = db.prepare('SELECT * FROM grammar_exercises WHERE id=?').get(Number(payload.id));
  if (!item) throw new Error('GRAMMAR_NOT_FOUND');
  const quality = answerQuality(payload.answer, JSON.parse(item.answers_json));
  const correct = quality.score >= 0.8;
  const xp = xpForAttempt({correct,mode:'grammar',rating:correct?3:1,streak:streak(db, now)});
  recordAttempt(db,{itemType:'grammar',itemId:item.id,mode:'grammar',skillType:'grammar',skillKey:item.skill,errorKind:quality.status,rating:correct?3:1,correct,responseMs:Number(payload.responseMs||0),xp,now});
  const guide=guidanceFor('grammar',item.skill);
  return { quality, expected: JSON.parse(item.answers_json), explanation:item.explanation, guidance:correct?null:guide, xp };
}

export function randomListening(db) {
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel=level === 'UNASSESSED' ? 'A1' : level;
  const rows=db.prepare(`SELECT l.* FROM listening_items l
    LEFT JOIN skill_mastery m ON m.skill_type='listening' AND m.skill_key=('listening-' || l.level)
    WHERE l.level<=? ORDER BY COALESCE(m.score,0.5) ASC,RANDOM() LIMIT 30`).all(maxLevel);
  return attachCurriculum(db,'listening',rankByReadiness(db,'listening',rows)[0]||rows[0]);
}

export function submitListening(db, payload, now = new Date()) {
  const item = db.prepare('SELECT * FROM listening_items WHERE id=?').get(Number(payload.id));
  if (!item) throw new Error('LISTENING_NOT_FOUND');
  const quality = answerQuality(payload.answer, item.text);
  const correct = quality.score >= 0.8;
  const xp = xpForAttempt({correct,mode:'listening',rating:correct?3:1,streak:streak(db, now)});
  const meta=curriculumMeta(db,'listening',item.id);
  recordAttempt(db,{itemType:'listening',itemId:item.id,mode:'listening',skillType:'listening',skillKey:meta?`${item.level}:${meta.topic}`:`listening-${item.level}`,errorKind:quality.status,rating:correct?3:1,correct,responseMs:Number(payload.responseMs||0),xp,now});
  return { quality, expected:item.text, translation:item.translation, help:listeningHelp(item,quality), xp };
}

export function randomReading(db) {
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel=level === 'UNASSESSED' ? 'A1' : level;
  const rows=db.prepare(`SELECT r.* FROM reading_texts r
    LEFT JOIN skill_mastery m ON m.skill_type='reading' AND m.skill_key=('reading-' || r.level)
    WHERE r.level<=? ORDER BY COALESCE(m.score,0.5) ASC,RANDOM() LIMIT 24`).all(maxLevel);
  const item=attachCurriculum(db,'reading',rankByReadiness(db,'reading',rows)[0]||rows[0]);
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
  const meta=curriculumMeta(db,'reading',item.id);
  const skillKey=meta?`${item.level}:${meta.topic}`:`reading-${item.level}`;
  recordAttempt(db,{itemType:'reading',itemId:item.id,mode:'reading',skillType:'reading',skillKey,errorKind:isCorrect?'correct':'comprehension',rating:isCorrect?3:1,correct:isCorrect,responseMs:Number(payload.responseMs||0),xp,now});
  return { correct, total:questions.length, details, guidance:isCorrect?null:guidanceFor('reading',skillKey), xp };
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
  const now = new Date();
  const nowIso=now.toISOString();
  const level = getMeta(db,'placementLevel','A1');
  const maxLevel = level === 'UNASSESSED' ? 'A1' : level;
  const pressure=reviewPressure(db,now);
  const freeze=pressure.freezeNew?'AND s.reps>0':'';
  const dueVocabulary = db.prepare(`SELECT v.id,v.spanish,v.portuguese,v.example_es,v.level,s.reps FROM srs s JOIN vocabulary v ON v.id=s.item_id WHERE s.item_type='vocabulary' AND s.due_at<=? AND v.level<=? ${freeze} ORDER BY s.due_at LIMIT 30`).all(nowIso,maxLevel);
  const learning = db.prepare(`SELECT l.id,l.kind,l.prompt,l.level,l.skill,s.reps FROM learning_items l JOIN srs s ON s.item_type=l.kind AND s.item_id=l.id
    WHERE l.level<=? AND s.due_at<=? ${freeze}
    ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type=l.kind AND e.item_id=l.id AND e.resolved_at IS NULL) DESC,s.due_at LIMIT 16`).all(maxLevel,nowIso);
  const grammar = db.prepare(`SELECT g.id,g.prompt,g.level,g.skill
    FROM grammar_exercises g
    LEFT JOIN skill_mastery m ON m.skill_type='grammar' AND m.skill_key=g.skill
    WHERE g.level <= ?
    ORDER BY (SELECT COUNT(*) FROM error_log e WHERE e.item_type='grammar' AND e.item_id=g.id AND e.resolved_at IS NULL) DESC,
      COALESCE(m.score,0.5) ASC, RANDOM() LIMIT 12`).all(maxLevel);
  const listening = db.prepare(`SELECT l.id,l.text,l.level
    FROM listening_items l
    LEFT JOIN skill_mastery m ON m.skill_type='listening' AND m.skill_key=('listening-' || l.level)
    WHERE l.level <= ?
    ORDER BY COALESCE(m.score,0.5) ASC, RANDOM() LIMIT 8`).all(maxLevel);
  const reading = db.prepare(`SELECT r.id,r.title,r.level
    FROM reading_texts r
    LEFT JOIN skill_mastery m ON m.skill_type='reading' AND m.skill_key=('reading-' || r.level)
    WHERE r.level <= ?
    ORDER BY COALESCE(m.score,0.5) ASC, RANDOM() LIMIT 6`).all(maxLevel);

  const vocabRanked=dueVocabulary.length&&Number(dueVocabulary[0].reps||0)>0?dueVocabulary:rankByReadiness(db,'vocabulary',dueVocabulary);
  const learningRanked=[...learning].sort((a,b)=>prerequisiteReadiness(db,b.kind,b.id)-prerequisiteReadiness(db,a.kind,a.id));
  const grammarRanked=rankByReadiness(db,'grammar',grammar);
  const listeningRanked=rankByReadiness(db,'listening',listening);
  const readingRanked=rankByReadiness(db,'reading',reading);
  return selectInterleavedSession({dueVocabulary:vocabRanked,learning:learningRanked,grammar:grammarRanked,listening:listeningRanked,reading:readingRanked,limit});
}

export function completeSpeaking(db, payload, now = new Date()) {
  const itemId = Number(payload.id || 0);
  const effort = Math.max(1, Math.min(4, Number(payload.effort || 3)));
  const xp = xpForAttempt({correct:true,mode:'speaking',rating:effort,streak:streak(db, now)});
  recordAttempt(db,{itemType:'speaking',itemId,mode:'speaking',skillType:'speaking',skillKey:'shadowing',errorKind:'self_assessed',rating:effort,correct:true,responseMs:Number(payload.responseMs||0),xp,now});
  return {xp};
}

export function exportData(db) {
  const tables = ['meta','vocabulary','srs','reviews','activity','skill_mastery','skill_events','error_log','curriculum_meta'];
  const out = { schemaVersion:'SIDES-EXPORT-V3', exportedAt:new Date().toISOString(), tables:{} };
  for (const table of tables) out.tables[table] = db.prepare(`SELECT * FROM ${table}`).all();
  return out;
}