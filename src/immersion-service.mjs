import { getMeta } from './db.mjs';
import { checkWriting } from './writing-service.mjs';
import { IMMERSION_SCENARIOS, IMMERSION_STORIES, scenariosUpTo, storiesUpTo } from './immersion-content.mjs';

const LEVELS=['A1','A2','B1','B2'];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n||0)));
const strip=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9ñüáéíóú ]/gi,' ').replace(/\s+/g,' ').trim();
const wordCount=s=>strip(s)?strip(s).split(' ').length:0;
const dayKey=now=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const levelWeight=level=>Math.max(1,LEVELS.indexOf(level)+1);

export function ensureImmersionSchema(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS immersion_sessions(
      id INTEGER PRIMARY KEY,
      mode TEXT NOT NULL CHECK(mode IN ('scenario','story')),
      content_id TEXT NOT NULL,
      level TEXT NOT NULL,
      topic TEXT NOT NULL,
      current_step TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','abandoned')),
      input_mode TEXT NOT NULL DEFAULT 'text',
      turns INTEGER NOT NULL DEFAULT 0,
      successful_turns INTEGER NOT NULL DEFAULT 0,
      response_words INTEGER NOT NULL DEFAULT 0,
      correction_count INTEGER NOT NULL DEFAULT 0,
      target_minutes INTEGER NOT NULL DEFAULT 10,
      score INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS immersion_turn_metrics(
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL,
      turn_index INTEGER NOT NULL,
      step_id TEXT NOT NULL,
      intent TEXT NOT NULL DEFAULT '',
      success INTEGER NOT NULL,
      input_mode TEXT NOT NULL,
      response_words INTEGER NOT NULL DEFAULT 0,
      response_ms INTEGER NOT NULL DEFAULT 0,
      issue_count INTEGER NOT NULL DEFAULT 0,
      review_index INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES immersion_sessions(id) ON DELETE CASCADE
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_immersion_sessions_time ON immersion_sessions(started_at,status,mode);
    CREATE INDEX IF NOT EXISTS idx_immersion_sessions_content ON immersion_sessions(content_id,completed_at);
    CREATE INDEX IF NOT EXISTS idx_immersion_turns_session ON immersion_turn_metrics(session_id,turn_index);
  `);
  db.prepare("INSERT INTO meta(key,value) VALUES ('immersionSchemaVersion','SIDES-IMMERSION-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-IMMERSION-V1'").run();
}

function maxLevel(db){const level=getMeta(db,'placementLevel','UNASSESSED');return level==='UNASSESSED'?'A1':level}
function recentContent(db,days=21,now=new Date()){
  const since=new Date(now.getTime()-days*86400000).toISOString();
  return new Set(db.prepare("SELECT content_id FROM immersion_sessions WHERE completed_at>=? AND status='completed'").all(since).map(x=>x.content_id));
}
function weakTokens(db){
  return db.prepare(`SELECT skill_type,skill_key,score FROM skill_mastery WHERE attempts>0
    ORDER BY score ASC,attempts DESC LIMIT 10`).all().map(x=>`${x.skill_type}:${x.skill_key}`);
}
function rankContent(db,items,{topic=null,now=new Date()}={}){
  const recent=recentContent(db,21,now),weak=weakTokens(db),requested=String(topic||'').trim();
  return [...items].map((item,index)=>{
    let score=0;
    if(requested&&item.topic===requested)score+=40;
    if(!recent.has(item.id))score+=18;
    if(item.level===maxLevel(db))score+=8;
    for(const target of item.targetSkills||[]){if(weak.includes(target))score+=12}
    return {item,score,index};
  }).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);
}
function contentById(mode,id){return (mode==='story'?IMMERSION_STORIES:IMMERSION_SCENARIOS).find(x=>x.id===id)||null}
function nodeById(scenario,id){return scenario.nodes.find(x=>x.id===id)||null}
function publicNode(node){
  if(!node)return null;
  return {id:node.id,speaker:node.speaker,text:node.text,task:node.task,
    options:node.options.map(x=>({id:x.id,label:x.label,intent:x.intent})),
    help:node.options.filter(x=>!x.repair).map(x=>({intent:x.intent,model:x.model}))};
}
function publicStoryQuestion(story,index){const q=story.questions[index];return q?{index,prompt:q.prompt}:null}
function publicSession(db,row){
  const content=contentById(row.mode,row.content_id);
  const base={id:Number(row.id),mode:row.mode,contentId:row.content_id,level:row.level,topic:row.topic,status:row.status,inputMode:row.input_mode,
    turns:Number(row.turns),successfulTurns:Number(row.successful_turns),responseWords:Number(row.response_words),targetMinutes:Number(row.target_minutes),score:Number(row.score),xp:Number(row.xp),
    title:content?.title||'',setting:content?.setting||'',startedAt:row.started_at,completedAt:row.completed_at};
  if(row.mode==='scenario')return {...base,node:row.status==='active'?publicNode(nodeById(content,row.current_step)):null};
  const index=Number(String(row.current_step).replace('q',''))||0;
  return {...base,story:content?{title:content.title,body:content.body}:null,question:row.status==='active'?publicStoryQuestion(content,index):null};
}

export function immersionPlan(db,now=new Date()){
  ensureImmersionSchema(db);
  const level=maxLevel(db),scenario=rankContent(db,scenariosUpTo(level),{now})[0],story=rankContent(db,storiesUpTo(level),{now})[0];
  return {level,targetMinutes:(scenario?.targetMinutes||10)+(story?.targetMinutes||8),languageRatioTarget:85,
    items:[scenario&&{mode:'scenario',id:scenario.id,title:scenario.title,topic:scenario.topic,minutes:scenario.targetMinutes},story&&{mode:'story',id:story.id,title:story.title,topic:story.topic,minutes:story.targetMinutes}].filter(Boolean),
    note:'Durante a sessão, tente manter pelo menos 85% da produção em espanhol. Português fica reservado para explicações quando necessário.'};
}

export function startImmersion(db,payload={},now=new Date()){
  ensureImmersionSchema(db);
  const mode=payload.mode==='story'?'story':'scenario',level=maxLevel(db),items=mode==='story'?storiesUpTo(level):scenariosUpTo(level);
  let content=payload.contentId?contentById(mode,String(payload.contentId)):null;
  if(content&&LEVELS.indexOf(content.level)>LEVELS.indexOf(level))content=null;
  if(!content)content=rankContent(db,items,{topic:payload.topic,now})[0];
  if(!content)throw new Error('IMMERSION_CONTENT_NOT_FOUND');
  const currentStep=mode==='scenario'?content.startNode:'q0',inputMode=['text','voice','guided'].includes(payload.inputMode)?payload.inputMode:'text';
  const r=db.prepare(`INSERT INTO immersion_sessions(mode,content_id,level,topic,current_step,input_mode,target_minutes,started_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(mode,content.id,content.level,content.topic,currentStep,inputMode,content.targetMinutes||10,now.toISOString());
  return publicSession(db,db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(Number(r.lastInsertRowid)));
}

function intentMatch(text,options){
  const s=strip(text);if(!s)return null;
  let best=null;
  for(const op of options){
    let score=0;
    for(const raw of op.keywords||[]){const k=strip(raw);if(k&&s.includes(k))score+=Math.max(2,k.split(' ').length*2)}
    if(score>(best?.score||0))best={option:op,score};
  }
  return best?.score>=2?best.option:null;
}
function storyCorrect(text,answers){
  const value=strip(text);if(!value)return false;
  return answers.some(a=>{const expected=strip(a);return value.includes(expected)||expected.includes(value)});
}
function recordTurn(db,row,{stepId,intent='',success,inputMode,responseWords,responseMs,issueCount=0,reviewIndex=null},now){
  const turn=Number(row.turns)+1;
  db.prepare(`INSERT INTO immersion_turn_metrics(session_id,turn_index,step_id,intent,success,input_mode,response_words,response_ms,issue_count,review_index,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(row.id,turn,stepId,intent,success?1:0,inputMode,responseWords,responseMs,issueCount,reviewIndex,now.toISOString());
  db.prepare(`UPDATE immersion_sessions SET turns=turns+1,successful_turns=successful_turns+?,response_words=response_words+?,correction_count=correction_count+?,input_mode=? WHERE id=?`)
    .run(success?1:0,responseWords,issueCount,inputMode,row.id);
}
function ensureDay(db,day){db.prepare('INSERT OR IGNORE INTO activity(day) VALUES (?)').run(day)}
function updateImmersionSkill(db,key,success,now){
  const current=db.prepare("SELECT * FROM skill_mastery WHERE skill_type='immersion' AND skill_key=?").get(key),old=current?Number(current.score):0.5,alpha=current&&Number(current.attempts)>=5?0.18:0.28,next=clamp(old*(1-alpha)+(success?1:0)*alpha,0,1);
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at) VALUES ('immersion',?,?,?,?,?)
    ON CONFLICT(skill_type,skill_key) DO UPDATE SET attempts=skill_mastery.attempts+1,correct=skill_mastery.correct+excluded.correct,score=excluded.score,last_seen_at=excluded.last_seen_at`)
    .run(key,1,success?1:0,next,now.toISOString());
  db.prepare("INSERT INTO skill_events(skill_type,skill_key,correct,score_after,created_at) VALUES ('immersion',?,?,?,?)").run(key,success?1:0,next,now.toISOString());
}
function completeImmersion(db,id,now){
  const row=db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(id);if(!row)throw new Error('IMMERSION_SESSION_NOT_FOUND');
  const successRate=row.turns?Number(row.successful_turns)/Number(row.turns):0;
  const issuePenalty=Math.min(.25,Number(row.correction_count)/Math.max(10,Number(row.response_words))*1.5);
  const score=clamp(Math.round((successRate-issuePenalty)*100),0,100);
  const prior=db.prepare(`SELECT COUNT(*) n FROM immersion_sessions WHERE content_id=? AND status='completed' AND id<>? AND completed_at>=?`).get(row.content_id,row.id,new Date(now.getTime()-7*86400000).toISOString()).n;
  const base=(row.mode==='scenario'?18:13)+levelWeight(row.level)*3,repeatMultiplier=Number(prior)>0?.35:1,xp=clamp(Math.round(base*(.45+.55*score/100)*repeatMultiplier),4,34);
  db.prepare("UPDATE immersion_sessions SET status='completed',score=?,xp=?,completed_at=?,current_step='end' WHERE id=?").run(score,xp,now.toISOString(),row.id);
  const success=score>=65,rating=score>=90?4:score>=75?3:score>=55?2:1;
  db.prepare('INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES (?,?,?,?,?,?,?,?)').run('immersion',row.id,'immersion',rating,success?1:0,0,xp,now.toISOString());
  ensureDay(db,dayKey(now));
  db.prepare('UPDATE activity SET xp=xp+?,attempts=attempts+1,correct=correct+?,immersion=immersion+1,minutes=minutes+? WHERE day=?').run(xp,success?1:0,Number(row.target_minutes),dayKey(now));
  updateImmersionSkill(db,'conversation',success,now);updateImmersionSkill(db,row.topic,success,now);
  return publicSession(db,db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(row.id));
}

export async function respondImmersion(db,id,payload={},now=new Date(),deps={}){
  ensureImmersionSchema(db);
  const row=db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(Number(id));if(!row)throw new Error('IMMERSION_SESSION_NOT_FOUND');if(row.status!=='active')throw new Error('IMMERSION_SESSION_NOT_ACTIVE');
  const content=contentById(row.mode,row.content_id);if(!content)throw new Error('IMMERSION_CONTENT_NOT_FOUND');
  const text=String(payload.text||'').trim(),choiceId=String(payload.choiceId||''),inputMode=['text','voice','guided'].includes(payload.inputMode)?payload.inputMode:(choiceId&&!text?'guided':row.input_mode);
  if(!text&&!choiceId)throw new Error('IMMERSION_RESPONSE_REQUIRED');
  let writing=null;if(text.length>=3){try{writing=await checkWriting(text,deps)}catch{writing=null}}
  const responseWords=wordCount(text),responseMs=clamp(payload.responseMs,0,3600000),issueCount=Number(writing?.issueCount||0),reviewIndex=writing?Number(writing.reviewIndex):null;

  if(row.mode==='scenario'){
    const current=nodeById(content,row.current_step);if(!current)throw new Error('IMMERSION_STEP_NOT_FOUND');
    let selected=choiceId?current.options.find(x=>x.id===choiceId):null;if(!selected&&text)selected=intentMatch(text,current.options);
    const success=Boolean(selected&&!selected.repair),intent=selected?.intent||'unrecognized';
    recordTurn(db,row,{stepId:current.id,intent,success,inputMode,responseWords,responseMs,issueCount,reviewIndex},now);
    if(success){
      const next=selected.next,feedback=selected.response;
      if(next==='end'){
        const completed=completeImmersion(db,row.id,now);
        return {success:true,intent,partner:feedback,completed:true,session:completed,writing:writing?writingFeedback(writing):null,notice:privacyNotice()};
      }
      db.prepare('UPDATE immersion_sessions SET current_step=? WHERE id=?').run(next,row.id);
      const updated=db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(row.id);
      return {success:true,intent,partner:feedback,completed:false,session:publicSession(db,updated),writing:writing?writingFeedback(writing):null,notice:privacyNotice()};
    }
    return {success:false,intent,partner:`Entiendo parte de la idea. Intenta responder al objetivo del turno: ${current.task}`,completed:false,session:publicSession(db,db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(row.id)),writing:writing?writingFeedback(writing):null,
      repair:{models:current.options.filter(x=>!x.repair).map(x=>x.model)},notice:privacyNotice()};
  }

  const index=Number(String(row.current_step).replace('q',''))||0,q=content.questions[index];if(!q)throw new Error('IMMERSION_STEP_NOT_FOUND');
  const success=storyCorrect(text,q.answers);recordTurn(db,row,{stepId:`q${index}`,intent:'comprehension',success,inputMode,responseWords,responseMs,issueCount,reviewIndex},now);
  const nextIndex=index+1,feedback=success?'Exacto. Has recuperado la idea principal.':`La respuesta esperada se apoya en esta idea: ${q.explanation}`;
  if(nextIndex>=content.questions.length){const completed=completeImmersion(db,row.id,now);return {success,partner:feedback,completed:true,session:completed,writing:writing?writingFeedback(writing):null,notice:privacyNotice()}}
  db.prepare('UPDATE immersion_sessions SET current_step=? WHERE id=?').run(`q${nextIndex}`,row.id);
  return {success,partner:feedback,completed:false,session:publicSession(db,db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(row.id)),writing:writing?writingFeedback(writing):null,notice:privacyNotice()};
}

function writingFeedback(result){return {engine:result.engine,issueCount:result.issueCount,reviewIndex:result.reviewIndex,categories:result.categories.map(x=>({category:x.category,label:x.label,action:x.action})),notice:result.notice}}
function privacyNotice(){return 'El SIDES usa la respuesta solo durante este turno. El SQLite guarda métricas, no el texto ni la transcripción.'}

export function getImmersionSession(db,id){ensureImmersionSchema(db);const row=db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(Number(id));if(!row)throw new Error('IMMERSION_SESSION_NOT_FOUND');return publicSession(db,row)}
export function abandonImmersion(db,id,now=new Date()){ensureImmersionSchema(db);const row=db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(Number(id));if(!row)throw new Error('IMMERSION_SESSION_NOT_FOUND');if(row.status==='active')db.prepare("UPDATE immersion_sessions SET status='abandoned',completed_at=? WHERE id=?").run(now.toISOString(),row.id);return publicSession(db,db.prepare('SELECT * FROM immersion_sessions WHERE id=?').get(row.id))}

export function immersionOverview(db,days=30,now=new Date()){
  ensureImmersionSchema(db);const safe=clamp(days,7,180),since=new Date(now.getTime()-safe*86400000).toISOString();
  const s=db.prepare(`SELECT COUNT(*) sessions,COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END),0) completed,
    COALESCE(AVG(CASE WHEN status='completed' THEN score END),0) average_score,COALESCE(SUM(response_words),0) words,COALESCE(SUM(xp),0) xp
    FROM immersion_sessions WHERE started_at>=?`).get(since);
  const topics=db.prepare(`SELECT topic,COUNT(*) sessions,ROUND(AVG(score)) score FROM immersion_sessions WHERE started_at>=? AND status='completed' GROUP BY topic ORDER BY sessions DESC,score ASC`).all(since).map(x=>({topic:x.topic,sessions:Number(x.sessions),score:Number(x.score||0)}));
  const recent=db.prepare(`SELECT id,mode,content_id,level,topic,status,turns,successful_turns,response_words,score,xp,started_at,completed_at FROM immersion_sessions WHERE started_at>=? ORDER BY started_at DESC LIMIT 10`).all(since)
    .map(x=>({id:Number(x.id),mode:x.mode,contentId:x.content_id,level:x.level,topic:x.topic,status:x.status,turns:Number(x.turns),successfulTurns:Number(x.successful_turns),responseWords:Number(x.response_words),score:Number(x.score),xp:Number(x.xp),startedAt:x.started_at,completedAt:x.completed_at}));
  const mastery=db.prepare("SELECT skill_key,attempts,ROUND(score*100) score,last_seen_at FROM skill_mastery WHERE skill_type='immersion' ORDER BY score ASC,attempts DESC").all();
  return {days:safe,sessions:Number(s.sessions),completed:Number(s.completed),averageScore:Math.round(Number(s.average_score||0)),words:Number(s.words),xp:Number(s.xp),topics,recent,mastery,plan:immersionPlan(db,now)};
}
