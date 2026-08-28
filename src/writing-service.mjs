import { getMeta } from './db.mjs';
import { WRITING_PROMPTS, promptsUpTo } from './writing-prompts.mjs';
import { checkLanguageTool, fallbackWritingCheck, languageToolStatus, mergeWritingIssues } from './writing-runtime.mjs';

const CATEGORIES={
  'pt-interference':{label:'Interferência do português',explanation:'Há uma forma que parece ter vindo diretamente do português. Vale recuperar a expressão espanhola como uma unidade própria.',action:'Reescreva a frase sem traduzir palavra por palavra.'},
  'accent-spelling':{label:'Acentuação / grafia',explanation:'A forma está próxima, mas a grafia espanhola precisa ser consolidada junto com a palavra.',action:'Digite novamente a palavra correta em uma frase diferente.'},
  spelling:{label:'Ortografia',explanation:'A grafia indicada pelo corretor merece revisão.',action:'Confira a sugestão e reutilize a palavra em uma frase nova.'},
  agreement:{label:'Concordância',explanation:'Gênero, número ou concordância entre os elementos da frase pode estar inconsistente.',action:'Localize substantivo, artigo/adjetivo ou sujeito/verbo e confira se combinam.'},
  'gender-number':{label:'Gênero e número',explanation:'Revise gênero e número dos elementos relacionados.',action:'Reescreva a frase mudando singular/plural para testar a concordância.'},
  verb:{label:'Forma verbal',explanation:'A forma verbal, o tempo ou a pessoa pode precisar de ajuste.',action:'Identifique o sujeito e produza duas frases com o mesmo verbo em pessoas diferentes.'},
  past:{label:'Tempos do passado',explanation:'A escolha ou formação do passado ainda merece prática contextual.',action:'Conte o mesmo fato com um marcador temporal explícito.'},
  preposition:{label:'Preposição',explanation:'Preposições raramente correspondem uma a uma entre português e espanhol.',action:'Memorize a combinação completa em vez da preposição isolada.'},
  pronoun:{label:'Pronomes',explanation:'Revise a posição ou a escolha do pronome na frase.',action:'Faça uma segunda versão da frase trocando a pessoa envolvida.'},
  'ser-estar':{label:'Ser × estar',explanation:'Revise se a ideia expressa identidade/característica ou estado/localização.',action:'Produza um par contrastando “ser” e “estar”.'},
  'por-para':{label:'Por × para',explanation:'“Para” costuma marcar finalidade/destino; “por”, causa/meio/percurso, entre outros usos.',action:'Pergunte se a ideia responde “para quê?” ou “por qual motivo/meio?”.'},
  subjunctive:{label:'Subjuntivo',explanation:'Desejo, hipótese, dúvida ou ação ainda não realizada pode exigir subjuntivo.',action:'Reescreva usando um gatilho como “quiero que”, “aunque” ou “cuando”.'},
  connectors:{label:'Conectores',explanation:'A relação lógica entre ideias pode ficar mais clara com conectores adequados.',action:'Marque causa, contraste, consequência e conclusão antes de reescrever.'},
  register:{label:'Registro e adequação',explanation:'A forma pode estar correta, mas o grau de formalidade pode não combinar com a situação.',action:'Faça uma versão mais direta e outra mais formal e compare.'},
  punctuation:{label:'Pontuação',explanation:'Pontuação ajuda a leitura e, em espanhol, perguntas e exclamações usam sinais de abertura e fechamento.',action:'Leia a frase em voz alta e marque onde a ideia realmente muda ou termina.'},
  capitalization:{label:'Maiúsculas/minúsculas',explanation:'Revise o uso de maiúsculas conforme a função da palavra na frase.',action:'Corrija a forma e observe o mesmo padrão em outra frase.'},
  style:{label:'Clareza e estilo',explanation:'A frase pode ser gramaticalmente possível, mas há uma alternativa mais clara ou natural.',action:'Tente dizer a mesma ideia com menos palavras sem perder informação.'},
  'grammar-other':{label:'Gramática',explanation:'O corretor encontrou um padrão gramatical que não cabe em uma categoria mais específica.',action:'Leia a mensagem da regra, aplique a correção e produza outro exemplo.'}
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n||0)));
const words=s=>String(s||'').trim()?String(s).trim().split(/\s+/u).length:0;

export function writingCategoryInfo(category){return {category,...(CATEGORIES[category]||CATEGORIES['grammar-other'])}}

export function ensureWritingSchema(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS writing_attempts(
      id INTEGER PRIMARY KEY,
      prompt_id TEXT NOT NULL DEFAULT '',
      context_type TEXT NOT NULL DEFAULT 'free',
      revision_of INTEGER,
      word_count INTEGER NOT NULL DEFAULT 0,
      char_count INTEGER NOT NULL DEFAULT 0,
      issue_count INTEGER NOT NULL DEFAULT 0,
      review_index INTEGER NOT NULL DEFAULT 0,
      engine TEXT NOT NULL,
      response_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(revision_of) REFERENCES writing_attempts(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS writing_issue_summary(
      attempt_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      issue_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(attempt_id,category),
      FOREIGN KEY(attempt_id) REFERENCES writing_attempts(id) ON DELETE CASCADE
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_writing_attempts_time ON writing_attempts(created_at,context_type);
    CREATE INDEX IF NOT EXISTS idx_writing_issue_category ON writing_issue_summary(category,attempt_id);
  `);
  db.prepare("INSERT INTO meta(key,value) VALUES ('writingSchemaVersion','SIDES-WRITING-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-WRITING-V1'").run();
}

function reviewIndex(text,issues){
  const n=Math.max(20,words(text));
  const weighted=issues.reduce((s,x)=>s+(Number(x.severity||1)),0);
  return clamp(Math.round(100-weighted*100/n),0,100);
}
function summarize(issues){
  const map=new Map();
  for(const issue of issues)map.set(issue.category,(map.get(issue.category)||0)+1);
  return [...map.entries()].map(([category,count])=>({category,count,...writingCategoryInfo(category)})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
}

export async function checkWriting(text,{env=process.env,fetchImpl=fetch}={}){
  const source=String(text||'').trim();
  if(source.length<3)throw new Error('WRITING_TEXT_TOO_SHORT');
  if(source.length>8000)throw new Error('WRITING_TEXT_TOO_LONG');
  const fallback=fallbackWritingCheck(source);
  let lt=null,ltError=null;
  try{lt=await checkLanguageTool(source,{env,fetchImpl})}catch(error){ltError=error?.message||'LANGUAGETOOL_UNAVAILABLE'}
  const issues=mergeWritingIssues(fallback,lt);
  const categories=summarize(issues);
  return {
    engine:lt?'languagetool+sides':'sides-fallback',
    languageToolUsed:Boolean(lt),languageToolError:lt?null:ltError,
    wordCount:words(source),charCount:source.length,issueCount:issues.length,reviewIndex:reviewIndex(source,issues),
    issues:issues.map(x=>({...x,categoryInfo:writingCategoryInfo(x.category)})),categories,
    notice:'As sugestões são apoio à revisão. Nem o LanguageTool nem as regras locais garantem que toda sugestão seja correta no contexto.'
  };
}

function updateSkill(db,key,outcome,now){
  const current=db.prepare("SELECT * FROM skill_mastery WHERE skill_type='writing' AND skill_key=?").get(key);
  const old=current?Number(current.score):0.5,alpha=current&&Number(current.attempts)>=5?0.18:0.28,next=clamp(old*(1-alpha)+clamp(outcome,0,1)*alpha,0,1);
  const correct=outcome>=0.72;
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at)
    VALUES ('writing',?,?,?,?,?) ON CONFLICT(skill_type,skill_key) DO UPDATE SET attempts=skill_mastery.attempts+1,
    correct=skill_mastery.correct+excluded.correct,score=excluded.score,last_seen_at=excluded.last_seen_at`).run(key,1,correct?1:0,next,now.toISOString());
  db.prepare("INSERT INTO skill_events(skill_type,skill_key,correct,score_after,created_at) VALUES ('writing',?,?,?,?)").run(key,correct?1:0,next,now.toISOString());
  return next;
}
function ensureDay(db,day){db.prepare('INSERT OR IGNORE INTO activity(day) VALUES (?)').run(day)}
function dayKey(now){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`}

export async function submitWriting(db,payload={},now=new Date(),deps={}){
  ensureWritingSchema(db);
  const result=await checkWriting(payload.text,deps);
  const promptId=String(payload.promptId||'').slice(0,100),prompt=WRITING_PROMPTS.find(x=>x.id===promptId)||null;
  const context=String(payload.contextType||prompt?.context||'free').slice(0,40);
  const revisionOf=payload.revisionOf?Number(payload.revisionOf):null;
  if(revisionOf&&!db.prepare('SELECT id FROM writing_attempts WHERE id=?').get(revisionOf))throw new Error('WRITING_REVISION_NOT_FOUND');
  const inserted=db.prepare(`INSERT INTO writing_attempts(prompt_id,context_type,revision_of,word_count,char_count,issue_count,review_index,engine,response_ms,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(promptId,context,revisionOf,result.wordCount,result.charCount,result.issueCount,result.reviewIndex,result.engine,Math.max(0,Number(payload.responseMs||0)),now.toISOString());
  const id=Number(inserted.lastInsertRowid);
  for(const row of result.categories)db.prepare('INSERT INTO writing_issue_summary(attempt_id,category,issue_count) VALUES (?,?,?)').run(id,row.category,row.count);

  updateSkill(db,'overall',result.reviewIndex/100,now);
  for(const row of result.categories){
    updateSkill(db,row.category,Math.max(0,1-row.count/Math.max(3,result.wordCount/20)),now);
    db.prepare('INSERT INTO error_log(item_type,item_id,skill_key,error_kind,created_at) VALUES (?,?,?,?,?)').run('writing',id,row.category,row.category,now.toISOString());
  }
  const recovered=[];
  if(revisionOf){
    const previous=db.prepare('SELECT category FROM writing_issue_summary WHERE attempt_id=?').all(revisionOf).map(x=>x.category);
    const current=new Set(result.categories.map(x=>x.category));
    for(const category of previous){if(!current.has(category)){
      recovered.push(category);updateSkill(db,category,1,now);
      db.prepare("UPDATE error_log SET resolved_at=? WHERE item_type='writing' AND item_id=? AND skill_key=? AND resolved_at IS NULL").run(now.toISOString(),revisionOf,category);
    }}
  }
  const correct=result.reviewIndex>=75;
  const baseXp=6+Math.min(5,Math.floor(result.wordCount/40))+(result.reviewIndex>=90?4:result.reviewIndex>=75?2:0);
  const xp=clamp(Math.round(revisionOf?baseXp*0.75:baseXp),4,15),rating=result.reviewIndex>=90?4:result.reviewIndex>=75?3:result.reviewIndex>=55?2:1;
  db.prepare('INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES (?,?,?,?,?,?,?,?)').run('writing',id,'writing',rating,correct?1:0,Math.max(0,Number(payload.responseMs||0)),xp,now.toISOString());
  const day=dayKey(now);ensureDay(db,day);
  db.prepare('UPDATE activity SET xp=xp+?,attempts=attempts+1,correct=correct+?,writing=writing+1,minutes=minutes+? WHERE day=?')
    .run(xp,correct?1:0,Math.max(0,Math.round(Number(payload.responseMs||0)/60000)),day);
  return {...result,id,xp,revisionOf,recovered,recoveredDetails:recovered.map(writingCategoryInfo),nextRecommendation:recommendNextWriting(db)};
}

function weakestWritingSkill(db){
  return db.prepare("SELECT skill_key,score,attempts FROM skill_mastery WHERE skill_type='writing' AND skill_key<>'overall' AND attempts>0 ORDER BY score ASC,attempts DESC LIMIT 1").get()||null;
}
export function nextWritingPrompt(db,requestedSkill=null){
  const level=getMeta(db,'placementLevel','UNASSESSED'),max=level==='UNASSESSED'?'A1':level;
  let skill=String(requestedSkill||'').trim();
  if(!skill)skill=weakestWritingSkill(db)?.skill_key||'';
  const available=promptsUpTo(max),exact=skill?available.filter(x=>x.skill===skill):[];
  const levelRows=available.filter(x=>x.level===max);
  const pool=exact.length?exact:(levelRows.length?levelRows:available);
  if(!pool.length)return null;
  const index=Math.floor(Math.random()*pool.length),item=pool[index];
  return {...item,adaptiveSkill:skill||item.skill,categoryInfo:writingCategoryInfo(skill||item.skill)};
}
export function recommendNextWriting(db){
  const weak=weakestWritingSkill(db);
  return {weakest:weak?{skill:weak.skill_key,score:Math.round(Number(weak.score)*100),...writingCategoryInfo(weak.skill_key)}:null,prompt:nextWritingPrompt(db,weak?.skill_key||null)};
}

export function writingOverview(db,days=30,now=new Date()){
  ensureWritingSchema(db);
  const safe=clamp(days,7,180),since=new Date(now.getTime()-safe*86400000).toISOString();
  const stats=db.prepare(`SELECT COUNT(*) attempts,COALESCE(SUM(word_count),0) words,COALESCE(AVG(review_index),0) average,
    COALESCE(SUM(CASE WHEN revision_of IS NOT NULL THEN 1 ELSE 0 END),0) revisions FROM writing_attempts WHERE created_at>=?`).get(since);
  const categories=db.prepare(`SELECT s.category,SUM(s.issue_count) count FROM writing_issue_summary s JOIN writing_attempts a ON a.id=s.attempt_id
    WHERE a.created_at>=? GROUP BY s.category ORDER BY count DESC LIMIT 12`).all(since).map(x=>({category:x.category,count:Number(x.count),...writingCategoryInfo(x.category)}));
  const recent=db.prepare(`SELECT id,prompt_id,context_type,revision_of,word_count,issue_count,review_index,engine,created_at
    FROM writing_attempts WHERE created_at>=? ORDER BY created_at DESC LIMIT 12`).all(since).map(x=>({...x,revisionOf:x.revision_of,wordCount:x.word_count,issueCount:x.issue_count,reviewIndex:x.review_index,promptId:x.prompt_id,contextType:x.context_type}));
  const skills=db.prepare("SELECT skill_key,attempts,ROUND(score*100) score,last_seen_at FROM skill_mastery WHERE skill_type='writing' ORDER BY score ASC,attempts DESC").all();
  return {days:safe,attempts:Number(stats.attempts),words:Number(stats.words),averageReviewIndex:Math.round(Number(stats.average||0)),revisions:Number(stats.revisions),categories,recent,skills,recommendation:recommendNextWriting(db)};
}

export async function writingStatus(deps={}){
  const languageTool=await languageToolStatus(deps);
  return {localFallback:true,languageTool,privacy:languageTool.allowed?'LanguageTool configurado somente em loopback.':'URL remota bloqueada; somente o corretor local do SIDES será usado.'};
}
