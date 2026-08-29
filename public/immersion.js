const $=q=>document.querySelector(q);
const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const api=async(path,options={})=>{const r=await fetch(path,options);const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro');return data};
let current=null,planQueue=[],startedAt=0,mediaRecorder=null,chunks=[],timerId=null,voiceReady=false,voiceRuntime=null;

async function load(){
  const [overview,speech]=await Promise.all([api('/api/immersion/overview'),api('/api/speech/status')]);
  voiceRuntime=speech.whisper||{};voiceReady=Boolean(voiceRuntime.ready);renderVoiceRuntime();renderOverview(overview);
}
function renderVoiceRuntime(){
  const status=$('#voiceStatus'),setup=$('#voiceSetup'),record=$('#recordBtn');
  if(voiceReady){
    status.textContent='Voz offline: pronta';status.className='trendBadge up';setup.classList.add('hidden');record.title='Responder falando com transcrição local';
  }else{
    const binary=voiceRuntime?.binaryReady?'binário pronto':'binário ausente',model=voiceRuntime?.modelReady?'modelo pronto':'modelo ausente';
    status.textContent='Voz offline: configuração necessária';status.className='trendBadge neutral';setup.classList.remove('hidden');record.title=`Whisper não configurado (${binary}; ${model})`;
  }
}
function renderOverview(o){
  $('#stats').innerHTML=`<div><b>${o.completed}</b><span>sessões concluídas</span></div><div><b>${o.averageScore}%</b><span>desempenho médio</span></div><div><b>${o.words}</b><span>palavras produzidas</span></div><div><b>${o.xp}</b><span>XP de imersão</span></div>`;
  $('#topics').innerHTML=o.topics?.length?o.topics.map(x=>`<div class="topicStat"><span>${safe(topicLabel(x.topic))}</span><span>${x.sessions} sessão(ões) · ${x.score}%</span></div>`).join(''):'<p class="sub">Ainda não há sessões concluídas.</p>';
  $('#history').innerHTML=o.recent?.length?o.recent.map(x=>`<div class="historyRow"><span>${safe(x.level)} · ${safe(topicLabel(x.topic))}</span><span>${safe(x.status==='completed'?`${x.score}% · +${x.xp} XP`:statusLabel(x.status))}</span></div>`).join(''):'<p class="sub">O histórico começa na primeira sessão.</p>';
}
const topicLabel=x=>({daily:'Cotidiano',travel:'Viagem',food:'Alimentação',work:'Trabalho',health:'Saúde',media:'Opinião/mídia',congregation:'Congregação',shopping:'Compras'}[x]||x);
const statusLabel=x=>({active:'em andamento',completed:'concluída',abandoned:'encerrada'}[x]||x);

async function start(mode,contentId=null){
  if(current?.status==='active'&&!confirm('Há uma sessão em andamento. Encerrar e iniciar outra?'))return;
  if(current?.status==='active')await api(`/api/immersion/${current.id}/abandon`,{method:'POST'});
  const topic=$('#topic').value,currentPayload={mode,inputMode:'text'};if(topic&&mode==='scenario')currentPayload.topic=topic;if(contentId)currentPayload.contentId=contentId;
  current=await api('/api/immersion/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(currentPayload)});
  $('#completeCard').classList.add('hidden');$('#sessionCard').classList.remove('hidden');$('#chat').innerHTML='';$('#turnFeedback').innerHTML='';startedAt=Date.now();renderSession(true);$('#sessionCard').scrollIntoView({behavior:'smooth',block:'start'});
}
async function startPlan(){
  const plan=await api('/api/immersion/plan');planQueue=[...(plan.items||[])];if(!planQueue.length)return;const first=planQueue.shift();await start(first.mode,first.id);
}
function renderSession(first=false){
  if(!current)return;$('#sessionMeta').textContent=`${current.level} · ${topicLabel(current.topic)} · alvo ${current.targetMinutes} min`;$('#sessionTitle').textContent=current.title;
  if(current.mode==='story'){
    $('#storyText').classList.remove('hidden');$('#storyText').innerHTML=`<strong>${safe(current.story?.title||current.title)}</strong><p>${safe(current.story?.body||'')}</p>`;
    if(first)appendBubble('partner','Narrador','Lee el texto una vez sin traducir cada frase. Después responde con tus propias palabras.');
    $('#objective').innerHTML=`<strong>Pregunta:</strong> ${safe(current.question?.prompt||'')}`;$('#help').innerHTML='<p>Vuelve al texto y busca la idea, no una traducción literal.</p>';$('#guided').innerHTML='';
  }else{
    $('#storyText').classList.add('hidden');const n=current.node;if(first&&n)appendBubble('partner',n.speaker,n.text);else if(n&&!lastPartnerIs(n.text))appendBubble('partner',n.speaker,n.text);
    $('#objective').innerHTML=`<strong>Objetivo del turno:</strong> ${safe(n?.task||'')}`;
    $('#help').innerHTML=(n?.help||[]).map(x=>`<p><b>${safe(x.intent)}:</b> ${safe(x.model)}</p>`).join('')||'<p>Intenta expresar la idea con tus propias palabras.</p>';
    $('#guided').innerHTML=(n?.options||[]).map(x=>`<button class="ghost" data-choice="${safe(x.id)}">${safe(x.label)}</button>`).join('');document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>send('',b.dataset.choice,'guided'));
  }
  $('#response').value='';$('#response').focus();
}
function appendBubble(kind,speaker,text){const d=document.createElement('div');d.className=`bubble ${kind}`;d.innerHTML=`<small>${safe(speaker)}</small>${safe(text)}`;$('#chat').append(d);d.scrollIntoView({behavior:'smooth',block:'nearest'});}
function lastPartnerIs(text){const rows=[...$('#chat').querySelectorAll('.bubble.partner')];return rows.length&&rows.at(-1).textContent.includes(text)}

async function send(text=$('#response').value,choiceId='',inputMode='text'){
  if(!current)return;const trimmed=String(text||'').trim();if(!trimmed&&!choiceId)return;$('#sendBtn').disabled=true;
  if(trimmed)appendBubble('user','Tú',trimmed);const responseMs=Math.max(0,Date.now()-startedAt);startedAt=Date.now();
  try{
    const result=await api(`/api/immersion/${current.id}/respond`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:trimmed,choiceId,inputMode,responseMs})});
    appendBubble('partner',current.mode==='story'?'CURESP':'Interlocutor',result.partner);renderFeedback(result);
    current=result.session;
    if(result.completed)finish(result);else renderSession(false);
  }catch(e){$('#turnFeedback').innerHTML=`<div class="feedbackBox warn"><b>Não foi possível processar o turno.</b><p>${safe(e.message)}</p></div>`}finally{$('#sendBtn').disabled=false}
}
function renderFeedback(r){const w=r.writing;let html=`<div class="feedbackBox ${r.success?'good':'warn'}"><b>${r.success?'Objetivo comunicativo atingido':'Reformule a resposta'}</b>`;
  if(w)html+=`<p>Revisão linguística: ${w.reviewIndex}% · ${w.issueCount} ponto(s) para revisar.</p>${w.categories?.length?`<div class="writingHints">${w.categories.slice(0,3).map(x=>`<span><b>${safe(x.label)}:</b> ${safe(x.action)}</span>`).join('')}</div>`:''}`;
  if(r.repair?.models?.length)html+=`<p class="sub">Se precisar, abra “Preciso de uma pista”.</p>`;html+=`<p class="sub">${safe(r.notice||'')}</p></div>`;$('#turnFeedback').innerHTML=html;
}
async function finish(result){
  current=result.session;$('#sessionCard').classList.add('hidden');const c=$('#completeCard');c.classList.remove('hidden');c.innerHTML=`<div class="sectionTitle"><div><span class="eyebrow">Sessão concluída</span><h2>${safe(current.title)}</h2></div><span class="trendBadge">+${current.xp} XP</span></div><div class="metricGrid"><div class="metricBox"><b>${current.score}%</b><span>desempenho</span></div><div class="metricBox"><b>${current.successfulTurns}/${current.turns}</b><span>turnos bem-sucedidos</span></div><div class="metricBox"><b>${current.responseWords}</b><span>palavras produzidas</span></div></div>${planQueue.length?'<p><button id="continuePlan">Continuar sessão imersiva</button></p>':'<p><button id="another">Fazer outra prática</button></p>'}`;
  if(planQueue.length)$('#continuePlan').onclick=async()=>{const next=planQueue.shift();await start(next.mode,next.id)};else $('#another').onclick=()=>start('scenario');await load();c.scrollIntoView({behavior:'smooth',block:'start'});
}

function voiceNotice(title,message){$('#turnFeedback').innerHTML=`<div class="feedbackBox warn"><b>${safe(title)}</b><p>${safe(message)}</p></div>`}
function microphoneErrorMessage(error){
  if(error?.name==='NotAllowedError'||error?.name==='SecurityError')return 'O Chrome não tem permissão para usar o microfone. Clique no ícone ao lado do endereço 127.0.0.1, permita Microfone e tente novamente.';
  if(error?.name==='NotFoundError'||error?.name==='DevicesNotFoundError')return 'Nenhum microfone foi encontrado no Windows. Verifique se o dispositivo está conectado e habilitado.';
  if(error?.name==='NotReadableError'||error?.name==='TrackStartError')return 'O microfone foi encontrado, mas não pôde ser aberto. Ele pode estar sendo usado exclusivamente por outro aplicativo.';
  return `Não foi possível abrir o microfone${error?.message?`: ${error.message}`:'.'}`;
}
async function record(){
  if(!voiceReady){voiceNotice('Voz offline ainda não está configurada','Abra Menu Iniciar → CURESP → Configurar voz offline. Depois da configuração o CURESP reinicia e a resposta por voz fica disponível. Você pode continuar este turno por texto.');return}
  if(!navigator.mediaDevices?.getUserMedia){voiceNotice('Microfone indisponível','Este navegador não oferece acesso ao microfone para esta página.');return}
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){voiceNotice('Não foi possível acessar o microfone',microphoneErrorMessage(e));return}
  try{
    chunks=[];mediaRecorder=new MediaRecorder(stream);mediaRecorder.ondataavailable=e=>chunks.push(e.data);mediaRecorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());clearInterval(timerId);try{const blob=new Blob(chunks,{type:mediaRecorder.mimeType||'audio/webm'}),wav=await toWav(blob);$('#turnFeedback').innerHTML='<div class="feedbackBox">Transcrevendo localmente…</div>';const r=await fetch('/api/speech/transcribe',{method:'POST',headers:{'Content-Type':'audio/wav'},body:wav});const data=await r.json();if(!r.ok)throw new Error(data.error||'Falha na transcrição');$('#response').value=data.transcript;await send(data.transcript,'','voice')}catch(e){voiceNotice('Não foi possível transcrever o áudio',e.message)}finally{$('#recordBtn').disabled=false;$('#stopBtn').disabled=true;$('#timer').textContent='00:00'}};mediaRecorder.start();const started=Date.now();timerId=setInterval(()=>{const s=Math.floor((Date.now()-started)/1000);$('#timer').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},250);$('#recordBtn').disabled=true;$('#stopBtn').disabled=false;
  }catch(e){stream.getTracks().forEach(t=>t.stop());voiceNotice('Não foi possível iniciar a gravação',e.message||'O gravador de áudio não está disponível neste navegador.')}
}
function stop(){if(mediaRecorder&&mediaRecorder.state!=='inactive')mediaRecorder.stop();mediaRecorder=null}
async function toWav(blob){const ab=await blob.arrayBuffer(),ctx=new AudioContext(),decoded=await ctx.decodeAudioData(ab.slice(0)),length=Math.ceil(decoded.duration*16000),offline=new OfflineAudioContext(1,length,16000),src=offline.createBufferSource();src.buffer=decoded;src.connect(offline.destination);src.start();const rendered=await offline.startRendering();await ctx.close();return encodeWav(rendered.getChannelData(0),16000)}
function encodeWav(samples,rate){const buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf),write=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));write(0,'RIFF');v.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,samples.length*2,true);let o=44;for(const x of samples){const s=Math.max(-1,Math.min(1,x));v.setInt16(o,s<0?s*0x8000:s*0x7fff,true);o+=2}return buf}

$('#scenarioBtn').onclick=()=>start('scenario');$('#storyBtn').onclick=()=>start('story');$('#planBtn').onclick=startPlan;$('#sendBtn').onclick=()=>send();$('#response').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.ctrlKey)send()});$('#recordBtn').onclick=record;$('#stopBtn').onclick=stop;$('#abandonBtn').onclick=async()=>{if(!current)return;if(confirm('Encerrar esta sessão? As métricas dos turnos já feitos serão mantidas, mas não haverá XP de conclusão.')){current=await api(`/api/immersion/${current.id}/abandon`,{method:'POST'});$('#sessionCard').classList.add('hidden');await load()}};
load();