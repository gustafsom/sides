const $=id=>document.getElementById(id);
const state={prompt:null,revisionOf:null,editorStartedAt:Date.now(),lastSaved:null};

async function api(path,options={}){
  const r=await fetch(path,options);let data={};
  try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data.error||`HTTP_${r.status}`);return data;
}
const jsonPost=(path,data)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function clear(el){while(el.firstChild)el.firstChild.remove()}
function row(title,value,small=''){
  const el=document.createElement('div');el.className='historyRow';
  const left=document.createElement('div'),strong=document.createElement('strong');strong.textContent=title;left.append(strong);
  if(small){const s=document.createElement('small');s.textContent=small;left.append(s)}
  const right=document.createElement('span');right.textContent=value;el.append(left,right);return el;
}
function countWords(text){const x=text.trim();return x?x.split(/\s+/u).length:0}
function updateCounter(){
  const n=countWords($('writingText').value),target=state.prompt;
  $('wordCounter').textContent=target?`${n} palavras · alvo ${target.minWords}–${target.maxWords}`:`${n} palavras`;
}

async function loadStatus(){
  try{
    const s=await api('/api/writing/status');
    if(s.languageTool?.ready&&s.languageTool?.spanish){$('runtimeBadge').textContent='LanguageTool local ativo · fallback SIDES ativo';}
    else if(s.languageTool?.allowed){$('runtimeBadge').textContent='Corretor SIDES ativo · LanguageTool local indisponível';}
    else{$('runtimeBadge').textContent='Corretor SIDES ativo · URL remota do LanguageTool bloqueada';}
  }catch{$('runtimeBadge').textContent='Corretor local SIDES ativo'}
}

function renderPrompt(item){
  state.prompt=item||null;state.revisionOf=null;state.editorStartedAt=Date.now();$('revisionNote').textContent='';
  if(!item){
    $('promptTitle').textContent='Texto livre';$('promptText').textContent='Escreva sobre qualquer tema em espanhol. O SIDES analisará os padrões encontrados.';clear($('promptMeta'));return;
  }
  $('promptTitle').textContent=item.title;$('promptText').textContent=item.prompt;clear($('promptMeta'));
  for(const value of [item.level,item.context,`${item.minWords}–${item.maxWords} palavras`,item.categoryInfo?.label||item.skill]){
    const s=document.createElement('span');s.textContent=value;$('promptMeta').append(s);
  }
  updateCounter();
}
async function loadPrompt(skill=null){
  const q=skill?`?skill=${encodeURIComponent(skill)}`:'';const data=await api(`/api/writing/prompt${q}`);renderPrompt(data.item);
}

function renderOverview(o){
  clear($('writingStats'));
  for(const [label,value] of [['Tentativas',o.attempts],['Palavras',o.words],['Índice médio',`${o.averageReviewIndex}%`],['Reescritas',o.revisions]]){
    const box=document.createElement('div');box.className='stat';const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=label;box.append(strong,span);$('writingStats').append(box);
  }
  clear($('categoryHistory'));
  if(!o.categories.length)$('categoryHistory').append(row('Ainda sem padrões','—','Registre uma tentativa para começar.'));
  for(const c of o.categories)$('categoryHistory').append(row(c.label,String(c.count),c.action));
  clear($('recentWriting'));
  if(!o.recent.length)$('recentWriting').append(row('Nenhuma tentativa','—'));
  for(const x of o.recent)$('recentWriting').append(row(`${x.reviewIndex}% · ${x.wordCount} palavras`,new Date(x.created_at).toLocaleDateString('pt-BR'),`${x.issueCount} ponto(s) · ${x.engine}${x.revisionOf?' · reescrita':''}`));
  clear($('weakWriting'));
  const weak=o.recommendation?.weakest;
  if(!weak)$('weakWriting').append(row('Sem histórico suficiente','Faça seu primeiro texto.'));
  else{
    $('weakWriting').append(row(weak.label,`${weak.score}%`,weak.explanation));
    const p=document.createElement('p');p.className='sub';p.textContent=weak.action;$('weakWriting').append(p);
    const b=document.createElement('button');b.className='ghost';b.textContent='Treinar este padrão';b.addEventListener('click',()=>loadPrompt(weak.skill));$('weakWriting').append(b);
  }
}
async function loadOverview(){try{renderOverview(await api('/api/writing/overview?days=30'))}catch(e){console.error(e)}}

function excerpt(text,issue){
  const start=Math.max(0,issue.offset-25),end=Math.min(text.length,issue.offset+issue.length+25);
  return `${start?'…':''}${text.slice(start,end)}${end<text.length?'…':''}`;
}
function applySuggestion(issue,value){
  const ta=$('writingText'),text=ta.value;
  ta.value=text.slice(0,issue.offset)+value+text.slice(issue.offset+issue.length);updateCounter();
  analyze(false).catch(()=>{});
}
function scoreClass(score){return score>=85?'scoreGood':score>=65?'scoreWarn':'scoreLow'}
function renderResult(result,saved=false){
  $('resultCard').classList.remove('hidden');$('reviewIndex').textContent=`${result.reviewIndex}%`;$('reviewIndex').className=`trendBadge ${scoreClass(result.reviewIndex)}`;
  $('resultTitle').textContent=saved?'Tentativa registrada':'Análise atual';clear($('resultSummary'));
  const summary=[`${result.wordCount} palavras`,`${result.issueCount} ponto(s) para revisar`,result.languageToolUsed?'LanguageTool local + SIDES':'Regras locais do SIDES'];
  if(result.recovered?.length)summary.push(`${result.recovered.length} padrão(ões) recuperado(s)`);
  for(const t of summary){const s=document.createElement('span');s.textContent=t;$('resultSummary').append(s)}
  clear($('issues'));
  if(!result.issues.length){const p=document.createElement('p');p.textContent='Nenhum ponto foi sinalizado pelas regras disponíveis. Ainda assim, releia o texto considerando clareza, contexto e intenção.';$('issues').append(p)}
  const text=$('writingText').value;
  for(const issue of result.issues){
    const card=document.createElement('article');card.className='issue';const top=document.createElement('div');top.className='issueTop';
    const h=document.createElement('h3');h.textContent=issue.categoryInfo?.label||issue.category;const source=document.createElement('small');source.textContent=issue.source==='languagetool'?'LanguageTool local':'Regra SIDES';top.append(h,source);
    const msg=document.createElement('p');msg.textContent=issue.message;const help=document.createElement('p');help.className='sub';help.textContent=issue.categoryInfo?.explanation||'';
    const ex=document.createElement('div');ex.className='issueExcerpt';ex.textContent=excerpt(text,issue);card.append(top,msg,help,ex);
    if(issue.replacements?.length){const list=document.createElement('div');list.className='replacementList';for(const value of issue.replacements.slice(0,4)){const b=document.createElement('button');b.className='ghost';b.textContent=`Aplicar: ${value}`;b.addEventListener('click',()=>applySuggestion(issue,value));list.append(b)}card.append(list)}
    $('issues').append(card);
  }
  $('revisionActions').classList.toggle('hidden',!saved||!result.id);
  $('resultCard').scrollIntoView({behavior:'smooth',block:'start'});
}

async function analyze(save){
  const text=$('writingText').value.trim();if(text.length<3){$('writingText').focus();return}
  const btn=save?$('submitBtn'):$('checkBtn'),old=btn.textContent;btn.disabled=true;btn.textContent=save?'Registrando…':'Analisando…';
  try{
    const payload={text,promptId:state.prompt?.id||'',contextType:state.prompt?.context||'free',responseMs:Date.now()-state.editorStartedAt};
    if(save&&state.revisionOf)payload.revisionOf=state.revisionOf;
    const result=save?await jsonPost('/api/writing/submit',payload):await jsonPost('/api/writing/check',{text});
    if(save){state.lastSaved=result;state.revisionOf=null;$('revisionNote').textContent='';await loadOverview()}
    renderResult(result,save);
  }catch(e){alert(`Não foi possível analisar o texto: ${e.message}`)}finally{btn.disabled=false;btn.textContent=old}
}

$('writingText').addEventListener('input',updateCounter);
$('checkBtn').addEventListener('click',()=>analyze(false));
$('submitBtn').addEventListener('click',()=>analyze(true));
$('newPrompt').addEventListener('click',async()=>{$('writingText').value='';updateCounter();$('resultCard').classList.add('hidden');await loadPrompt()});
$('freeMode').addEventListener('click',()=>{renderPrompt(null);$('writingText').value='';updateCounter();$('resultCard').classList.add('hidden');$('writingText').focus()});
$('reviseBtn').addEventListener('click',()=>{
  if(!state.lastSaved?.id)return;state.revisionOf=state.lastSaved.id;state.editorStartedAt=Date.now();
  $('revisionNote').textContent=`Reescrita da tentativa #${state.revisionOf}: padrões que desaparecerem serão marcados como recuperados.`;
  $('resultCard').classList.add('hidden');$('writingText').focus();
});

await Promise.all([loadStatus(),loadOverview(),loadPrompt()]);updateCounter();
