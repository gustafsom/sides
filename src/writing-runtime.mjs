const LOOPBACK=new Set(['127.0.0.1','localhost','::1','[::1]']);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n||0)));

function base(s){return String(s||'').normalize('NFD').replace(/\p{M}+/gu,'').toLowerCase()}
function safeUrl(raw){
  try{
    const u=new URL(String(raw||'http://127.0.0.1:8081'));
    const allowed=u.protocol==='http:'&&LOOPBACK.has(u.hostname);
    return {url:u.origin,allowed,reason:allowed?null:'LANGUAGETOOL_REMOTE_BLOCKED'};
  }catch{return {url:null,allowed:false,reason:'LANGUAGETOOL_URL_INVALID'}}
}
export function languageToolConfig(env=process.env){
  return {engine:'LanguageTool',...safeUrl(env.SIDES_LANGUAGETOOL_URL||'http://127.0.0.1:8081')};
}

async function fetchWithTimeout(fetchImpl,url,options={},timeoutMs=1200){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetchImpl(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}
}

export async function languageToolStatus({env=process.env,fetchImpl=fetch}={}){
  const config=languageToolConfig(env);
  if(!config.allowed)return {...config,ready:false};
  try{
    const r=await fetchWithTimeout(fetchImpl,`${config.url}/v2/languages`,{},700);
    if(!r.ok)return {...config,ready:false,httpStatus:r.status};
    const languages=await r.json();
    return {...config,ready:true,spanish:Array.isArray(languages)&&languages.some(x=>String(x.code||'').startsWith('es'))};
  }catch(error){return {...config,ready:false,error:error?.name==='AbortError'?'TIMEOUT':'UNAVAILABLE'}}
}

function categoryFromLt(match,text){
  const id=String(match?.rule?.id||'').toLowerCase();
  const category=String(match?.rule?.category?.id||match?.rule?.category?.name||'').toLowerCase();
  const message=String(match?.message||'').toLowerCase();
  const original=String(text).slice(Number(match.offset||0),Number(match.offset||0)+Number(match.length||0));
  const replacement=String(match?.replacements?.[0]?.value||'');
  if(original&&replacement&&base(original)===base(replacement)&&original.toLowerCase()!==replacement.toLowerCase())return 'accent-spelling';
  if(/ser.*estar|estar.*ser/.test(`${id} ${message}`))return 'ser-estar';
  if(/por.*para|para.*por/.test(`${id} ${message}`))return 'por-para';
  if(/pronoun|pronombre|clitic|clítico/.test(`${id} ${category} ${message}`))return 'pronoun';
  if(/preposition|preposición|preposicion/.test(`${id} ${category} ${message}`))return 'preposition';
  if(/concord|agreement|género|genero|masculin|feminin|singular|plural/.test(`${id} ${category} ${message}`))return 'agreement';
  if(/verb|verbo|conjug/.test(`${id} ${category} ${message}`))return 'verb';
  if(/typ|spell|ortograf|misspell/.test(`${id} ${category} ${message}`))return 'spelling';
  if(/capital|casing|mayúsc|minuscul/.test(`${id} ${category} ${message}`))return 'capitalization';
  if(/punct|puntuaci/.test(`${id} ${category} ${message}`))return 'punctuation';
  if(/style|estilo|redundan|readability/.test(`${id} ${category} ${message}`))return 'style';
  return 'grammar-other';
}

export function normalizeLanguageToolMatches(data,text){
  return (Array.isArray(data?.matches)?data.matches:[]).slice(0,100).map(m=>({
    source:'languagetool',
    ruleId:String(m?.rule?.id||'LT_RULE'),
    category:categoryFromLt(m,text),
    message:String(m?.message||'Revise este trecho.'),
    shortMessage:String(m?.shortMessage||''),
    offset:clamp(m?.offset,0,String(text).length),
    length:clamp(m?.length,0,String(text).length),
    replacements:(m?.replacements||[]).slice(0,5).map(x=>String(x.value||'')).filter(Boolean),
    severity:/style|punctuation/.test(categoryFromLt(m,text))?1:2
  }));
}

export async function checkLanguageTool(text,{env=process.env,fetchImpl=fetch,timeoutMs=3000}={}){
  const config=languageToolConfig(env);
  if(!config.allowed)throw new Error(config.reason);
  const body=new URLSearchParams({text:String(text),language:'es'});
  let r;
  try{
    r=await fetchWithTimeout(fetchImpl,`${config.url}/v2/check`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body},timeoutMs);
  }catch(error){throw new Error(error?.name==='AbortError'?'LANGUAGETOOL_TIMEOUT':'LANGUAGETOOL_UNAVAILABLE')}
  if(!r.ok)throw new Error(`LANGUAGETOOL_HTTP_${r.status}`);
  const data=await r.json();
  return {engine:'languagetool',issues:normalizeLanguageToolMatches(data,text),software:data?.software||null,language:data?.language||null};
}

function escapeRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function wordIssues(text,word,replacement,category='pt-interference',message=null){
  const out=[];
  const re=new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRe(word)}(?![\\p{L}\\p{N}_])`,'giu');
  for(const m of text.matchAll(re))out.push({source:'sides',ruleId:`SIDES_${category.toUpperCase().replace(/[^A-Z0-9]+/g,'_')}_${base(word).toUpperCase()}`,category,
    message:message||`Possível interferência do português: “${m[0]}”.`,offset:m.index,length:m[0].length,replacements:replacement?[replacement]:[],severity:2});
  return out;
}

export function fallbackWritingCheck(text){
  const source=String(text||''),issues=[];
  const pt=[
    ['você','usted','pt-interference'],['vocês','ustedes','pt-interference'],['não','no','pt-interference'],['também','también','pt-interference'],
    ['uma','una','pt-interference'],['meu','mi','pt-interference'],['minha','mi','pt-interference'],['seu','su','pt-interference'],['sua','su','pt-interference'],
    ['obrigado','gracias','pt-interference'],['obrigada','gracias','pt-interference'],['hoje','hoy','pt-interference'],['amanhã','mañana','pt-interference'],
    ['ontem','ayer','pt-interference'],['sempre','siempre','pt-interference'],['mais','más','pt-interference'],['estou','estoy','pt-interference'],
    ['tenho','tengo','pt-interference'],['fazer','hacer','pt-interference'],['então','entonces','pt-interference']
  ];
  for(const [w,r,c] of pt)issues.push(...wordIssues(source,w,r,c));
  const accents=[['tambien','también'],['despues','después'],['ademas','además'],['dificil','difícil'],['facil','fácil'],['util','útil'],['ingles','inglés'],['portugues','portugués'],['jovenes','jóvenes'],['numero','número']];
  for(const [w,r] of accents)issues.push(...wordIssues(source,w,r,'accent-spelling',`Revise a acentuação de “${w}”.`));
  for(const m of source.matchAll(/ {2,}/g))issues.push({source:'sides',ruleId:'SIDES_DOUBLE_SPACE',category:'punctuation',message:'Há espaços consecutivos.',offset:m.index,length:m[0].length,replacements:[' '],severity:1});
  for(const m of source.matchAll(/\s+([,.;:!?])/g))issues.push({source:'sides',ruleId:'SIDES_SPACE_BEFORE_PUNCT',category:'punctuation',message:'Em espanhol, não coloque espaço antes deste sinal.',offset:m.index,length:m[0].length,replacements:[m[1]],severity:1});
  const trimmed=source.trim();
  const first=source.search(/\S/);
  if(trimmed.endsWith('?')&&!trimmed.startsWith('¿')&&first>=0)issues.push({source:'sides',ruleId:'SIDES_OPEN_QUESTION',category:'punctuation',message:'Perguntas em espanhol usam também o sinal de abertura “¿”.',offset:first,length:0,replacements:['¿'],severity:1});
  if(trimmed.endsWith('!')&&!trimmed.startsWith('¡')&&first>=0)issues.push({source:'sides',ruleId:'SIDES_OPEN_EXCLAMATION',category:'punctuation',message:'Exclamações em espanhol usam também o sinal de abertura “¡”.',offset:first,length:0,replacements:['¡'],severity:1});
  return {engine:'sides-fallback',issues};
}

export function mergeWritingIssues(...groups){
  const seen=new Set(),out=[];
  for(const issue of groups.flatMap(x=>x?.issues||[])){
    const key=`${issue.offset}|${issue.length}|${issue.category}|${issue.replacements?.[0]||''}`;
    if(seen.has(key))continue;seen.add(key);out.push(issue);
  }
  return out.sort((a,b)=>a.offset-b.offset||b.length-a.length).slice(0,120);
}
