const $=q=>document.querySelector(q);
const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const api=async(path,options={})=>{const r=await fetch(path,options);const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro');return data};
let runtime=null,mediaRecorder=null,chunks=[],recordingUrl=null,wavBuffer=null,audioStats=null,startedAt=0,timerId=null,currentTarget=null;

async function load(){
  const [status,overview]=await Promise.all([api('/api/speech/status'),api('/api/speech/overview')]);runtime=status;renderRuntime();renderOverview(overview);
}
function renderRuntime(){
  const w=runtime.whisper,p=runtime.piper;
  $('#runtime').innerHTML=`<p class="${w.ready?'runtimeOk':'runtimeWarn'}">Whisper: ${w.ready?'pronto':'não configurado'}</p><p class="sub">Binário: ${w.binaryReady?'ok':'ausente'} · Modelo: ${w.modelReady?safe(w.modelName):'ausente'} · idioma: espanhol</p>${w.ready?'':`<div class="runtimeSetup"><b>Para ativar a transcrição automática</b><p>Abra <b>Menu Iniciar → CURESP → Configurar voz offline</b>. A configuração é feita uma vez, valida os arquivos baixados e reinicia o CURESP.</p></div>`}<p class="${p.ready?'runtimeOk':'runtimeWarn'}">Piper: ${p.ready?'pronto':'opcional/não configurado'}</p><p class="sub">Fallback TTS: voz espanhola do navegador/SO.</p>`;
}
function renderOverview(o){
  const recent=o.recent||[];
  $('#overview').innerHTML=`<div class="metricGrid"><div class="speechMetric"><b>${o.count}</b><span>treinos</span></div><div class="speechMetric"><b>${o.averageAccuracy}%</b><span>correspondência</span></div><div class="speechMetric"><b>${o.averageWpm}</b><span>palavras/min</span></div></div>${recent.length?`<div class="historyMini">${recent.slice(0,5).map(x=>`<div><span>${new Date(x.createdAt).toLocaleDateString()}</span><span>${x.accuracy}% · ${x.wpm} ppm</span></div>`).join('')}</div>`:'<p class="sub">Faça o primeiro treino para iniciar seu histórico.</p>'}`;
}
async function loadTarget(){
  const kind=$('#kind').value;if(kind==='free'){currentTarget=null;$('#expected').value='';$('#targetMeta').textContent='Texto próprio temporário.';return}
  const {item}=await api(`/api/speech/target?kind=${encodeURIComponent(kind)}`);currentTarget=item;$('#expected').value=item?.text||'';$('#targetMeta').textContent=item?`${item.level||''}${item.title?' · '+item.title:''}`:'Nenhum alvo disponível.';
}
async function hear(){
  const text=$('#expected').value.trim();if(!text)return;
  if(runtime?.piper?.ready){
    try{const r=await fetch('/api/speech/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});if(r.ok){const blob=await r.blob();const url=URL.createObjectURL(blob);const a=new Audio(url);a.onended=()=>URL.revokeObjectURL(url);await a.play();return}}catch{}
  }
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es';speechSynthesis.speak(u);
}
function startTimer(){startedAt=Date.now();clearInterval(timerId);timerId=setInterval(()=>{const s=Math.floor((Date.now()-startedAt)/1000);$('#timer').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},250)}
function microphoneErrorMessage(error){
  if(error?.name==='NotAllowedError'||error?.name==='SecurityError')return 'O Chrome não tem permissão para usar o microfone. Clique no ícone ao lado do endereço 127.0.0.1, permita Microfone e tente novamente.';
  if(error?.name==='NotFoundError'||error?.name==='DevicesNotFoundError')return 'Nenhum microfone foi encontrado no Windows. Verifique se o dispositivo está conectado e habilitado.';
  if(error?.name==='NotReadableError'||error?.name==='TrackStartError')return 'O microfone foi encontrado, mas não pôde ser aberto. Ele pode estar sendo usado exclusivamente por outro aplicativo.';
  return `Não foi possível abrir o microfone${error?.message?`: ${error.message}`:'.'}`;
}
async function record(){
  if(!navigator.mediaDevices?.getUserMedia){showError('Este navegador não oferece acesso ao microfone para esta página.');return}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){showError(microphoneErrorMessage(e));return}
  try{
    chunks=[];const recorder=new MediaRecorder(stream),mimeType=recorder.mimeType||'audio/webm';mediaRecorder=recorder;recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=async()=>{if(mediaRecorder===recorder)mediaRecorder=null;stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:mimeType});if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl=URL.createObjectURL(blob);$('#preview').innerHTML=`<audio controls src="${recordingUrl}"></audio><p class="sub">Gravação temporária nesta aba.</p>`;try{const converted=await toWav(blob);wavBuffer=converted.wav;audioStats=converted.stats;$('#analyze').disabled=!runtime?.whisper?.ready;if(!runtime?.whisper?.ready)$('#preview').insertAdjacentHTML('beforeend','<p class="sub">Whisper ainda não configurado: use a transcrição manual ou ative a voz offline pelo Menu Iniciar → CURESP.</p>')}catch(e){$('#preview').insertAdjacentHTML('beforeend',`<p>${safe(e.message)}</p>`)};};recorder.start();startTimer();$('#record').disabled=true;$('#stop').disabled=false;$('#analyze').disabled=true;
  }catch(e){mediaRecorder=null;stream.getTracks().forEach(t=>t.stop());showError(e.message||'Não foi possível iniciar a gravação.')}
}
function stop(){const recorder=mediaRecorder;if(recorder&&recorder.state!=='inactive')recorder.stop();clearInterval(timerId);$('#record').disabled=false;$('#stop').disabled=true}
async function toWav(blob){
  const ab=await blob.arrayBuffer(),ctx=new AudioContext(),decoded=await ctx.decodeAudioData(ab.slice(0));const length=Math.ceil(decoded.duration*16000),offline=new OfflineAudioContext(1,length,16000),src=offline.createBufferSource();src.buffer=decoded;src.connect(offline.destination);src.start();const rendered=await offline.startRendering();await ctx.close();const samples=rendered.getChannelData(0),wav=encodeWav(samples,16000),stats=measureSilence(samples,16000);return {wav,stats};
}
function encodeWav(samples,rate){
  const buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf),write=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));write(0,'RIFF');v.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,samples.length*2,true);let o=44;for(const x of samples){const s=Math.max(-1,Math.min(1,x));v.setInt16(o,s<0?s*0x8000:s*0x7fff,true);o+=2}return buf;
}
function measureSilence(samples,rate){
  const frame=Math.max(1,Math.round(rate*.02)),threshold=.018,voiced=[];for(let i=0;i<samples.length;i+=frame){let sum=0,n=0;for(let j=i;j<Math.min(samples.length,i+frame);j++){sum+=samples[j]*samples[j];n++}voiced.push(Math.sqrt(sum/Math.max(1,n))>=threshold)}
  let first=voiced.indexOf(true),last=voiced.lastIndexOf(true);if(first<0){first=0;last=voiced.length-1}let pauses=[],run=0;for(let i=first;i<=last;i++){if(!voiced[i])run++;else if(run){pauses.push(run*20);run=0}}if(run)pauses.push(run*20);return {durationMs:Math.round(samples.length/rate*1000),pauseCount:pauses.filter(x=>x>=300).length,longPauses:pauses.filter(x=>x>=700).length,maxPauseMs:pauses.length?Math.max(...pauses):0,totalSilenceMs:Math.round(pauses.reduce((a,b)=>a+b,0))};
}
async function analyze(){
  const expected=$('#expected').value.trim();if(!expected||!wavBuffer)return;if(!runtime?.whisper?.ready){showError('Whisper local ainda não está configurado. Abra Menu Iniciar → CURESP → Configurar voz offline ou use a transcrição manual.');return}
  $('#analyze').disabled=true;try{const r=await fetch('/api/speech/transcribe',{method:'POST',headers:{'Content-Type':'audio/wav'},body:wavBuffer});const data=await r.json();if(!r.ok)throw new Error(data.error||'Falha na transcrição');await compare(data.transcript)}catch(e){showError(e.message)}finally{$('#analyze').disabled=false}
}
async function compare(transcript){
  const expected=$('#expected').value.trim();if(!expected||!transcript.trim())return;
  const data=await api('/api/speech/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected,transcript,contextType:currentTarget?.kind||($('#kind').value==='free'?'free':$('#kind').value),contextId:currentTarget?.id||0,durationMs:audioStats?.durationMs||0,audioStats:audioStats||{}})});renderResult(data);await load();
}
function renderResult(data){
  const m=data.metrics;$('#result').classList.remove('hidden');$('#result').innerHTML=`<h2>Resultado</h2><div class="metricGrid"><div class="speechMetric"><b>${m.accuracy}%</b><span>correspondência</span></div><div class="speechMetric"><b>${m.counts.omit}</b><span>omissões</span></div><div class="speechMetric"><b>${m.counts.substitute}</b><span>substituições</span></div><div class="speechMetric"><b>${m.wpm}</b><span>palavras/min</span></div><div class="speechMetric"><b>${m.longPauses}</b><span>pausas longas</span></div></div><h3>Comparação</h3><div class="diffLine">${m.steps.map(x=>`<span class="diffToken ${x.kind}" title="${safe(x.kind)}">${safe(x.kind==='add'?`+${x.recognized}`:x.kind==='omit'?`−${x.expected}`:x.kind==='substitute'?`${x.expected}→${x.recognized}`:x.expected)}</span>`).join('')}</div><h3>O que treinar agora</h3><div class="speechGuide">${data.guidance.map(x=>`<div>${safe(x)}</div>`).join('')}</div><p class="sub">Transcrição reconhecida: ${safe(data.transcript)}</p><p class="sub">${safe(data.notice)}</p>`;$('#result').scrollIntoView({behavior:'smooth',block:'start'});
}
function showError(message){$('#result').classList.remove('hidden');$('#result').innerHTML=`<h2>Não foi possível usar a transcrição automática</h2><p>${safe(message)}</p><p class="sub">O CURESP continua funcional: você pode configurar a voz offline ou usar o fallback de transcrição manual abaixo do gravador.</p>`}
$('#record').onclick=record;$('#stop').onclick=stop;$('#analyze').onclick=analyze;$('#loadTarget').onclick=loadTarget;$('#newTarget').onclick=loadTarget;$('#hear').onclick=hear;$('#manualAnalyze').onclick=()=>compare($('#manualTranscript').value);$('#kind').onchange=loadTarget;load().then(loadTarget);