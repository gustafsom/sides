// Bloco 6 — Minhas designações.
// O SIDES armazena somente referência curta, notas do usuário, plano e histórico de treino.
// Não importa, raspa ou persiste texto oficial do JW.org/JW Library.

const TYPES=new Set(['reading','comment','student','talk','ministry','other']);
const STATUS=new Set(['planned','practicing','ready','completed','cancelled']);

const TYPE_CONFIG={
  reading:{
    label:'Leitura da Bíblia',
    defaultSeconds:240,
    phases:{
      foundation:'Compreenda a referência, marque pronúncias difíceis e faça uma leitura lenta.',
      build:'Trabalhe precisão, pausas, pontuação, ritmo e palavras que ainda travam.',
      rehearsal:'Faça a leitura completa com cronômetro e avalie naturalidade e clareza.',
      final:'Faça um ensaio leve, priorizando confiança e estabilidade; evite treino excessivo.'
    }
  },
  comment:{
    label:'Comentário de reunião',
    defaultSeconds:45,
    phases:{
      foundation:'Defina uma ideia principal e o vocabulário necessário para expressá-la em espanhol.',
      build:'Responda sem ler, com começo direto, uma ideia principal e uma conclusão curta.',
      rehearsal:'Faça comentários cronometrados de 30–60 segundos e elimine palavras desnecessárias.',
      final:'Faça uma última recuperação espontânea em voz alta, sem decorar palavra por palavra.'
    }
  },
  student:{
    label:'Designação de estudante',
    defaultSeconds:180,
    phases:{
      foundation:'Separe objetivo, abertura, texto/referência e ponto principal da designação.',
      build:'Treine transições, explicação simples e a habilidade de ensino que deseja melhorar.',
      rehearsal:'Faça a designação inteira no tempo-alvo e registre as rubricas mais fracas.',
      final:'Faça um ensaio final leve, corrigindo apenas os dois pontos mais importantes.'
    }
  },
  talk:{
    label:'Discurso',
    defaultSeconds:600,
    phases:{
      foundation:'Organize introdução, pontos principais, transições e conclusão usando seu próprio esboço.',
      build:'Treine blocos do discurso, dando prioridade à clareza, naturalidade e vocabulário ativo.',
      rehearsal:'Faça ensaios integrais cronometrados e revise os pontos com menor domínio.',
      final:'Faça uma passagem final em baixa carga, mantendo o foco na mensagem e na confiança.'
    }
  },
  ministry:{
    label:'Apresentação de ministério',
    defaultSeconds:180,
    phases:{
      foundation:'Prepare uma abertura natural, uma pergunta simples e o vocabulário necessário.',
      build:'Treine ouvir, responder e fazer transições sem depender de frases decoradas.',
      rehearsal:'Simule a conversa inteira com variações e limite de tempo.',
      final:'Faça uma simulação leve, priorizando naturalidade, escuta e flexibilidade.'
    }
  },
  other:{
    label:'Outra designação',
    defaultSeconds:180,
    phases:{
      foundation:'Defina objetivo, vocabulário e estrutura básica da atividade.',
      build:'Treine os trechos mais difíceis em sessões curtas e espaçadas.',
      rehearsal:'Faça um ensaio integral cronometrado e registre os pontos de melhoria.',
      final:'Faça um ensaio final leve e preserve energia para a apresentação real.'
    }
  }
};

const pad2=n=>String(n).padStart(2,'0');
const localDayKey=(date=new Date())=>`${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
const dayNumber=key=>Math.floor(Date.UTC(...key.split('-').map((x,i)=>Number(x)-(i===1?1:0)))/86400000);
const daysBetween=(from,to)=>dayNumber(to)-dayNumber(from);
const addDays=(key,days)=>{
  const [y,m,d]=key.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d+days));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth()+1)}-${pad2(date.getUTCDate())}`;
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const clean=(value,max=500)=>String(value??'').trim().slice(0,max);

function validateDateKey(value){
  const v=String(value||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v))throw new Error('ASSIGNMENT_DATE_INVALID');
  const [y,m,d]=v.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()+1!==m||date.getUTCDate()!==d)throw new Error('ASSIGNMENT_DATE_INVALID');
  return v;
}

function validateTime(value){
  const v=clean(value,5);
  if(!v)return '';
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v))throw new Error('ASSIGNMENT_TIME_INVALID');
  return v;
}

export function ensureAssignmentsSchema(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS jw_assignments(
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('reading','comment','student','talk','ministry','other')),
      title TEXT NOT NULL,
      reference_text TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL,
      due_time TEXT NOT NULL DEFAULT '',
      target_seconds INTEGER NOT NULL DEFAULT 180,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','practicing','ready','completed','cancelled')),
      confidence INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS jw_assignment_practices(
      id INTEGER PRIMARY KEY,
      assignment_id INTEGER NOT NULL REFERENCES jw_assignments(id) ON DELETE CASCADE,
      phase TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      ratings_json TEXT NOT NULL DEFAULT '{}',
      confidence INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      practiced_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_jw_assignments_due ON jw_assignments(status,due_date,due_time);
    CREATE INDEX IF NOT EXISTS idx_jw_assignment_practice ON jw_assignment_practices(assignment_id,practiced_at);
  `);
  db.prepare("INSERT INTO meta(key,value) VALUES ('assignmentSchemaVersion','SIDES-JW-ASSIGNMENTS-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-JW-ASSIGNMENTS-V1'").run();
}

function practiceStats(db,id){
  const rows=db.prepare('SELECT * FROM jw_assignment_practices WHERE assignment_id=? ORDER BY practiced_at DESC').all(Number(id));
  const confidences=rows.map(x=>Number(x.confidence||0)).filter(x=>x>=1&&x<=5);
  const rubricValues=[],rubricMap=new Map();
  for(const row of rows){
    const ratings=JSON.parse(row.ratings_json||'{}');
    for(const [key,value] of Object.entries(ratings)){
      const n=Number(value);if(n<1||n>5)continue;
      rubricValues.push(n);const current=rubricMap.get(key)||[];current.push(n);rubricMap.set(key,current);
    }
  }
  const rubricAverages=[...rubricMap.entries()].map(([key,values])=>({
    key,average:Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)),attempts:values.length
  })).sort((a,b)=>a.average-b.average||b.attempts-a.attempts);
  return {
    rows,
    count:rows.length,
    averageConfidence:confidences.length?Number((confidences.reduce((a,b)=>a+b,0)/confidences.length).toFixed(1)):0,
    averageRubric:rubricValues.length?Number((rubricValues.reduce((a,b)=>a+b,0)/rubricValues.length).toFixed(1)):0,
    rubricAverages,
    lastPracticeAt:rows[0]?.practiced_at||null
  };
}

function readinessFrom(assignment,stats){
  const practicePart=Math.min(35,stats.count*8);
  const confidencePart=(stats.averageConfidence/5)*30;
  const rubricPart=(stats.averageRubric/5)*25;
  let timingPart=stats.count?10:0;
  if(stats.rows[0]&&Number(assignment.target_seconds)>0){
    const seconds=Number(stats.rows[0].duration_ms||0)/1000;
    const ratio=seconds/Number(assignment.target_seconds);
    timingPart=ratio>=0.75&&ratio<=1.15?10:ratio>=0.55&&ratio<=1.35?6:3;
  }
  return Math.round(clamp(practicePart+confidencePart+rubricPart+timingPart,0,100));
}

function phaseForDays(days){
  if(days<=1)return 'final';
  if(days<=7)return 'rehearsal';
  if(days<=14)return 'build';
  return 'foundation';
}

function recommendedDates(today,due){
  const days=daysBetween(today,due);
  if(days<0)return [];
  const set=new Set([today,due]);
  let cursor=0;
  while(cursor<days){
    const remaining=days-cursor;
    const step=remaining>14?3:remaining>7?2:1;
    cursor=Math.min(days,cursor+step);
    set.add(addDays(today,cursor));
  }
  return [...set].sort();
}

function matchedPracticeByDate(practices,date){
  return practices.find(x=>String(x.practiced_at).slice(0,10)===date)||null;
}

export function generateAssignmentPlan(assignment,practices=[],now=new Date()){
  const today=localDayKey(now);
  const due=assignment.due_date;
  const config=TYPE_CONFIG[assignment.type]||TYPE_CONFIG.other;
  const schedule=recommendedDates(today,due).map(date=>{
    const remaining=daysBetween(date,due);
    const phase=phaseForDays(remaining);
    const minutes=phase==='foundation'?8:phase==='build'?10:phase==='rehearsal'?Math.max(5,Math.ceil(Number(assignment.target_seconds)/60)+3):Math.max(4,Math.ceil(Number(assignment.target_seconds)/60));
    return {
      date,phase,minutes,
      instruction:config.phases[phase],
      done:Boolean(matchedPracticeByDate(practices,date))
    };
  });
  const next=schedule.find(x=>!x.done&&x.date>=today)||null;
  return {
    daysRemaining:daysBetween(today,due),
    phase:phaseForDays(daysBetween(today,due)),
    next,
    schedule,
    typeLabel:config.label
  };
}

function normalizeAssignment(row,db,now){
  const stats=practiceStats(db,row.id);
  const readiness=readinessFrom(row,stats);
  const plan=generateAssignmentPlan(row,stats.rows,now);
  plan.focusRubrics=stats.rubricAverages.slice(0,2);
  return {
    ...row,
    readiness,
    practiceCount:stats.count,
    averageConfidence:stats.averageConfidence,
    averageRubric:stats.averageRubric,
    lastPracticeAt:stats.lastPracticeAt,
    practices:stats.rows.map(row=>({
      id:row.id,phase:row.phase,durationMs:row.duration_ms,confidence:row.confidence,
      ratings:JSON.parse(row.ratings_json||'{}'),notes:row.notes,practicedAt:row.practiced_at
    })),
    plan
  };
}

export function createAssignment(db,payload={},now=new Date()){
  ensureAssignmentsSchema(db);
  const type=String(payload.type||'reading');
  if(!TYPES.has(type))throw new Error('ASSIGNMENT_TYPE_INVALID');
  const title=clean(payload.title,160);
  if(!title)throw new Error('ASSIGNMENT_TITLE_REQUIRED');
  const dueDate=validateDateKey(payload.dueDate);
  const dueTime=validateTime(payload.dueTime);
  const targetSeconds=clamp(Number(payload.targetSeconds||TYPE_CONFIG[type].defaultSeconds),15,7200);
  const reference=clean(payload.reference,180);
  const notes=clean(payload.notes,2000);
  const iso=now.toISOString();
  const result=db.prepare(`INSERT INTO jw_assignments(type,title,reference_text,due_date,due_time,target_seconds,notes,status,confidence,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,'planned',0,?,?)`).run(type,title,reference,dueDate,dueTime,targetSeconds,notes,iso,iso);
  return getAssignment(db,Number(result.lastInsertRowid),now);
}

export function updateAssignment(db,id,payload={},now=new Date()){
  ensureAssignmentsSchema(db);
  const current=db.prepare('SELECT * FROM jw_assignments WHERE id=?').get(Number(id));
  if(!current)throw new Error('ASSIGNMENT_NOT_FOUND');
  const type=payload.type==null?current.type:String(payload.type);
  if(!TYPES.has(type))throw new Error('ASSIGNMENT_TYPE_INVALID');
  const status=payload.status==null?current.status:String(payload.status);
  if(!STATUS.has(status))throw new Error('ASSIGNMENT_STATUS_INVALID');
  const title=payload.title==null?current.title:clean(payload.title,160);
  if(!title)throw new Error('ASSIGNMENT_TITLE_REQUIRED');
  const reference=payload.reference==null?current.reference_text:clean(payload.reference,180);
  const dueDate=payload.dueDate==null?current.due_date:validateDateKey(payload.dueDate);
  const dueTime=payload.dueTime==null?current.due_time:validateTime(payload.dueTime);
  const targetSeconds=payload.targetSeconds==null?current.target_seconds:clamp(Number(payload.targetSeconds),15,7200);
  const notes=payload.notes==null?current.notes:clean(payload.notes,2000);
  const confidence=payload.confidence==null?current.confidence:clamp(Number(payload.confidence),0,5);
  db.prepare(`UPDATE jw_assignments SET type=?,title=?,reference_text=?,due_date=?,due_time=?,target_seconds=?,notes=?,status=?,confidence=?,updated_at=? WHERE id=?`)
    .run(type,title,reference,dueDate,dueTime,targetSeconds,notes,status,confidence,now.toISOString(),Number(id));
  return getAssignment(db,id,now);
}

export function listAssignments(db,now=new Date()){
  ensureAssignmentsSchema(db);
  return db.prepare(`SELECT * FROM jw_assignments
    WHERE status<>'cancelled'
    ORDER BY CASE WHEN status='completed' THEN 1 ELSE 0 END,due_date ASC,due_time ASC,id ASC`).all()
    .map(row=>normalizeAssignment(row,db,now));
}

export function getAssignment(db,id,now=new Date()){
  ensureAssignmentsSchema(db);
  const row=db.prepare('SELECT * FROM jw_assignments WHERE id=?').get(Number(id));
  if(!row)throw new Error('ASSIGNMENT_NOT_FOUND');
  return normalizeAssignment(row,db,now);
}

function updateMastery(db,key,score,now){
  const correct=score>=0.6;
  const current=db.prepare("SELECT * FROM skill_mastery WHERE skill_type='jw' AND skill_key=?").get(key);
  const old=current?Number(current.score):0.5;
  const alpha=current&&current.attempts>=5?0.18:0.28;
  const next=clamp(old*(1-alpha)+(correct?1:0)*alpha,0,1);
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at)
    VALUES ('jw',?,?,?,?,?) ON CONFLICT(skill_type,skill_key) DO UPDATE SET
    attempts=skill_mastery.attempts+1,correct=skill_mastery.correct+excluded.correct,score=excluded.score,last_seen_at=excluded.last_seen_at`)
    .run(key,1,correct?1:0,next,now.toISOString());
  db.prepare("INSERT INTO skill_events(skill_type,skill_key,correct,score_after,created_at) VALUES ('jw',?,?,?,?)")
    .run(key,correct?1:0,next,now.toISOString());
}

export function recordAssignmentPractice(db,id,payload={},now=new Date()){
  ensureAssignmentsSchema(db);
  const assignment=db.prepare('SELECT * FROM jw_assignments WHERE id=?').get(Number(id));
  if(!assignment)throw new Error('ASSIGNMENT_NOT_FOUND');
  const phase=String(payload.phase||phaseForDays(daysBetween(localDayKey(now),assignment.due_date)));
  if(!new Set(['foundation','build','rehearsal','final']).has(phase))throw new Error('ASSIGNMENT_PHASE_INVALID');
  const ratings={};
  if(payload.ratings&&typeof payload.ratings==='object'){
    for(const [key,value] of Object.entries(payload.ratings)){
      const n=Number(value);if(n>=1&&n<=5)ratings[clean(key,80)]=n;
    }
  }
  const confidence=clamp(Number(payload.confidence||3),1,5);
  const durationMs=clamp(Number(payload.durationMs||0),0,7_200_000);
  const notes=clean(payload.notes,1200);
  db.prepare(`INSERT INTO jw_assignment_practices(assignment_id,phase,duration_ms,ratings_json,confidence,notes,practiced_at)
    VALUES (?,?,?,?,?,?,?)`).run(Number(id),phase,durationMs,JSON.stringify(ratings),confidence,notes,now.toISOString());

  const after=getAssignment(db,id,now);
  const nextStatus=after.readiness>=75?'ready':'practicing';
  db.prepare("UPDATE jw_assignments SET status=CASE WHEN status='completed' THEN status ELSE ? END,confidence=?,updated_at=? WHERE id=?")
    .run(nextStatus,confidence,now.toISOString(),Number(id));

  const xp=clamp(8+Math.round(durationMs/60000*2)+(after.readiness>=75?5:0),8,30);
  const day=localDayKey(now);
  db.prepare('INSERT OR IGNORE INTO activity(day) VALUES (?)').run(day);
  db.prepare('UPDATE activity SET xp=xp+?,attempts=attempts+1,correct=correct+1,speaking=speaking+1,minutes=minutes+? WHERE day=?')
    .run(xp,Math.max(0,Math.round(durationMs/60000)),day);
  db.prepare(`INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at)
    VALUES ('jw-assignment',?,'speaking',?,1,?,?,?)`)
    .run(Number(id),clamp(Math.round(confidence*0.8),1,4),durationMs,xp,now.toISOString());
  updateMastery(db,`assignment:${assignment.type}`,after.readiness/100,now);
  for(const [key,value] of Object.entries(ratings))updateMastery(db,`rubric:${key}`,value/5,now);

  return {...getAssignment(db,id,now),xp};
}

export function assignmentOverview(db,now=new Date()){
  const items=listAssignments(db,now);
  const active=items.filter(x=>!['completed','cancelled'].includes(x.status));
  const overdue=active.filter(x=>x.plan.daysRemaining<0);
  const upcoming=active.filter(x=>x.plan.daysRemaining>=0);
  const avg=active.length?Math.round(active.reduce((s,x)=>s+x.readiness,0)/active.length):0;
  return {
    total:items.length,
    active:active.length,
    overdue:overdue.length,
    ready:active.filter(x=>x.readiness>=75).length,
    averageReadiness:avg,
    next:upcoming[0]||null,
    items
  };
}

export { TYPE_CONFIG as assignmentTypes };
