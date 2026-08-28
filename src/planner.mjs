import { attentionReport } from './attention.mjs';
import { assignmentOverview } from './assignments.mjs';
import { effectiveXpReport } from './xp-economy.mjs';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n||0)));
const pad2=n=>String(n).padStart(2,'0');
const dayKey=date=>`${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
const startOfDay=date=>{const d=new Date(date);d.setHours(0,0,0,0);return d};
const endOfDay=date=>{const d=startOfDay(date);d.setDate(d.getDate()+1);return d};
const startOfWeek=date=>{const d=startOfDay(date);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};

export function ensurePlannerSchema(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_goals(
      id INTEGER PRIMARY KEY CHECK(id=1),
      daily_minutes INTEGER NOT NULL DEFAULT 20,
      weekly_minutes INTEGER NOT NULL DEFAULT 120,
      weekly_days INTEGER NOT NULL DEFAULT 5,
      preferred_session_minutes INTEGER NOT NULL DEFAULT 20,
      updated_at TEXT NOT NULL
    ) STRICT;
  `);
  db.prepare(`INSERT OR IGNORE INTO study_goals(id,daily_minutes,weekly_minutes,weekly_days,preferred_session_minutes,updated_at)
    VALUES (1,20,120,5,20,?)`).run(new Date().toISOString());
  db.prepare("INSERT INTO meta(key,value) VALUES ('plannerSchemaVersion','SIDES-PLANNER-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-PLANNER-V1'").run();
}

export function studyGoals(db){
  ensurePlannerSchema(db);
  const row=db.prepare('SELECT * FROM study_goals WHERE id=1').get();
  return {dailyMinutes:Number(row.daily_minutes),weeklyMinutes:Number(row.weekly_minutes),weeklyDays:Number(row.weekly_days),preferredSessionMinutes:Number(row.preferred_session_minutes),updatedAt:row.updated_at};
}

export function updateStudyGoals(db,payload={},now=new Date()){
  ensurePlannerSchema(db);
  const current=studyGoals(db);
  const next={
    dailyMinutes:clamp(payload.dailyMinutes??current.dailyMinutes,10,120),
    weeklyMinutes:clamp(payload.weeklyMinutes??current.weeklyMinutes,30,840),
    weeklyDays:clamp(payload.weeklyDays??current.weeklyDays,2,7),
    preferredSessionMinutes:clamp(payload.preferredSessionMinutes??current.preferredSessionMinutes,10,60)
  };
  db.prepare(`UPDATE study_goals SET daily_minutes=?,weekly_minutes=?,weekly_days=?,preferred_session_minutes=?,updated_at=? WHERE id=1`)
    .run(next.dailyMinutes,next.weeklyMinutes,next.weeklyDays,next.preferredSessionMinutes,now.toISOString());
  return studyGoals(db);
}

function existsTable(db,name){return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name))}
function msBetween(db,sql,start,end){return Number(db.prepare(sql).get(start.toISOString(),end.toISOString())?.ms||0)}

export function estimatedStudyMinutes(db,start,end){
  // Fontes são separadas para evitar dupla contagem dos módulos que já têm tabelas próprias.
  let ms=0;
  ms+=msBetween(db,`SELECT COALESCE(SUM(response_ms),0) ms FROM reviews
    WHERE reviewed_at>=? AND reviewed_at<? AND item_type NOT IN ('writing','jw-assignment','immersion')`,start,end);
  if(existsTable(db,'writing_attempts'))ms+=msBetween(db,'SELECT COALESCE(SUM(response_ms),0) ms FROM writing_attempts WHERE created_at>=? AND created_at<?',start,end);
  if(existsTable(db,'speech_attempts'))ms+=msBetween(db,'SELECT COALESCE(SUM(duration_ms),0) ms FROM speech_attempts WHERE created_at>=? AND created_at<?',start,end);
  if(existsTable(db,'jw_assignment_practices'))ms+=msBetween(db,'SELECT COALESCE(SUM(duration_ms),0) ms FROM jw_assignment_practices WHERE practiced_at>=? AND practiced_at<?',start,end);
  if(existsTable(db,'immersion_sessions')){
    const row=db.prepare(`SELECT COALESCE(SUM(target_minutes),0) minutes FROM immersion_sessions
      WHERE completed_at>=? AND completed_at<? AND status='completed'`).get(start.toISOString(),end.toISOString());
    ms+=Number(row?.minutes||0)*60000;
  }
  return Math.max(0,Math.round(ms/60000));
}

function weeklyModes(db,weekDay){
  const rows=db.prepare(`SELECT
    COALESCE(SUM(vocabulary),0) vocabulary,COALESCE(SUM(grammar),0) grammar,COALESCE(SUM(listening),0) listening,
    COALESCE(SUM(reading),0) reading,COALESCE(SUM(speaking),0) speaking,COALESCE(SUM(writing),0) writing,COALESCE(SUM(immersion),0) immersion
    FROM activity WHERE day>=?`).get(weekDay);
  return Object.fromEntries(Object.entries(rows||{}).map(([k,v])=>[k,Number(v||0)]));
}

function routeFor(type,key=''){
  if(type==='writing')return '/writing.html';
  if(type==='speech'||type==='speaking')return '/speech.html';
  if(type==='immersion')return '/immersion.html';
  if(type==='jw')return '/jw.html';
  if(type==='assignment')return '/assignments.html';
  if(type==='core')return '/?mode=session';
  const params=new URLSearchParams({mode:type});if(key)params.set('skill',key);
  return `/?${params.toString()}`;
}

function addItem(items,seen,item){
  if(!item||seen.has(item.id))return;
  seen.add(item.id);items.push(item);
}

function attentionPlanItem(row){
  const type=row.skillType==='speech'?'speech':row.skillType;
  const valid=new Set(['writing','speech','immersion','jw','grammar','vocabulary','chunk','contrast']);
  if(!valid.has(type))return null;
  const minutes=type==='immersion'?8:type==='writing'?7:type==='speech'?6:5;
  return {id:`attention:${type}:${row.skillKey}`,type,title:row.title,minutes,priority:70+Math.round(row.attentionScore/4),reason:`Atenção ${row.attentionScore}/100 · ${row.reasons.join(' · ')}`,route:routeFor(type,row.skillKey),skillKey:row.skillKey};
}

export function plannerProgress(db,now=new Date()){
  ensurePlannerSchema(db);
  const goals=studyGoals(db),todayStart=startOfDay(now),tomorrow=endOfDay(now),weekStart=startOfWeek(now);
  const todayMinutes=estimatedStudyMinutes(db,todayStart,tomorrow),weekMinutes=estimatedStudyMinutes(db,weekStart,tomorrow);
  const weekDayKey=dayKey(weekStart);
  const activeDays=Number(db.prepare('SELECT COUNT(*) n FROM activity WHERE day>=? AND attempts>0').get(weekDayKey)?.n||0);
  const modes=weeklyModes(db,weekDayKey),balancedModes=Object.values(modes).filter(x=>x>0).length;
  return {
    goals,
    today:{minutes:todayMinutes,target:goals.dailyMinutes,percent:Math.min(100,Math.round(todayMinutes/goals.dailyMinutes*100)),done:todayMinutes>=goals.dailyMinutes},
    week:{minutes:weekMinutes,targetMinutes:goals.weeklyMinutes,days:activeDays,targetDays:goals.weeklyDays,minutesPercent:Math.min(100,Math.round(weekMinutes/goals.weeklyMinutes*100)),daysPercent:Math.min(100,Math.round(activeDays/goals.weeklyDays*100)),done:weekMinutes>=goals.weeklyMinutes&&activeDays>=goals.weeklyDays},
    modes,balancedModes
  };
}

export function buildTodayPlan(db,now=new Date()){
  ensurePlannerSchema(db);
  const progress=plannerProgress(db,now),goals=progress.goals,items=[],seen=new Set();
  const due=Number(db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at<=? AND reps>0').get(now.toISOString()).n||0);
  const overdue7=Number(db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at<=? AND reps>0').get(new Date(now.getTime()-7*86400000).toISOString()).n||0);
  if(due>0)addItem(items,seen,{id:'core:reviews',type:'core',title:overdue7?`Recuperar ${overdue7} revisões atrasadas`:`Revisar ${due} itens FSRS`,minutes:Math.min(10,Math.max(5,Math.ceil(Math.min(due,30)/5))),priority:overdue7?100:88,reason:overdue7?'Revisões com mais de 7 dias de atraso têm prioridade máxima.':'Revisões vencidas preservam retenção antes de conteúdo novo.',route:routeFor('core')});

  const assignments=assignmentOverview(db,now),next=assignments.next;
  if(next&&next.plan.daysRemaining<=14){
    const days=next.plan.daysRemaining,priority=days<=1?100:days<=3?96:days<=7?90:82;
    addItem(items,seen,{id:`assignment:${next.id}`,type:'assignment',title:`Designação: ${next.title}`,minutes:Math.min(15,Math.max(5,Number(next.plan.next?.minutes||8))),priority,reason:`Faltam ${days} dia(s) · prontidão ${next.readiness}% · fase ${next.plan.phase}.`,route:'/assignments.html',assignmentId:next.id});
  }

  for(const row of attentionReport(db,now,10))if(row.attentionScore>=35)addItem(items,seen,attentionPlanItem(row));

  const coverage=[
    ['listening','Escuta de manutenção',4,progress.modes.listening,64],
    ['reading','Leitura de manutenção',5,progress.modes.reading,62],
    ['speaking','Fala de manutenção',6,progress.modes.speaking,68],
    ['writing','Escrita de manutenção',7,progress.modes.writing,66],
    ['immersion','Imersão conversacional',8,progress.modes.immersion,72]
  ];
  for(const [type,title,minutes,count,priority] of coverage){if(count===0)addItem(items,seen,{id:`coverage:${type}`,type,title,minutes,priority,reason:'Esta competência ainda não apareceu na semana atual.',route:routeFor(type)});}

  if(!items.some(x=>x.type==='immersion'))addItem(items,seen,{id:'practice:immersion',type:'immersion',title:'Conversação em espanhol',minutes:8,priority:55,reason:'Produção integrada ajuda a transformar conhecimento passivo em uso espontâneo.',route:'/immersion.html'});
  items.sort((a,b)=>b.priority-a.priority||a.minutes-b.minutes);

  const target=goals.preferredSessionMinutes,selected=[];let minutes=0;
  for(const item of items){
    if(selected.length>=6)break;
    if(minutes>=target&&selected.length>=2)break;
    selected.push(item);minutes+=item.minutes;
  }
  if(!selected.length)selected.push({id:'core:maintenance',type:'core',title:'Sessão curta de manutenção',minutes:Math.min(10,target),priority:50,reason:'Nenhuma urgência detectada; faça uma sessão intercalada leve.',route:routeFor('core')});
  minutes=selected.reduce((s,x)=>s+x.minutes,0);
  return {generatedAt:now.toISOString(),targetMinutes:target,estimatedMinutes:minutes,dueReviews:due,overdue7,assignment:next?{id:next.id,title:next.title,daysRemaining:next.plan.daysRemaining,readiness:next.readiness}:null,items:selected};
}

export function plannerOverview(db,now=new Date()){
  const progress=plannerProgress(db,now),plan=buildTodayPlan(db,now),rewards=effectiveXpReport(db,now);
  const badges=[
    {id:'daily-goal',title:'Meta diária',unlocked:progress.today.done,description:`${progress.today.minutes}/${progress.today.target} min hoje`},
    {id:'weekly-time',title:'Meta semanal de tempo',unlocked:progress.week.minutes>=progress.week.targetMinutes,description:`${progress.week.minutes}/${progress.week.targetMinutes} min na semana`},
    {id:'weekly-days',title:'Consistência semanal',unlocked:progress.week.days>=progress.week.targetDays,description:`${progress.week.days}/${progress.week.targetDays} dias ativos`},
    {id:'balanced',title:'Semana equilibrada',unlocked:progress.balancedModes>=5,description:`${progress.balancedModes}/7 competências praticadas`},
    {id:'review-control',title:'Revisões sob controle',unlocked:plan.overdue7===0,description:plan.overdue7===0?'Nenhuma revisão atrasada >7 dias':`${plan.overdue7} revisão(ões) atrasada(s)`}
  ];
  return {schema:'SIDES-PLANNER-V1',progress,plan,rewards,badges};
}
