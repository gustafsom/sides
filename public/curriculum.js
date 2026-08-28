const safe=(s)=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const label={vocabulary:'Vocabulário',learning:'Frases / chunks',grammar:'Gramática',listening:'Escuta',reading:'Leitura'};

async function loadCurriculum(){
  const root=document.querySelector('#curriculumMap');
  if(!root)return;
  try{
    const r=await fetch('/api/curriculum',{headers:{'Accept':'application/json'}});
    if(!r.ok)throw new Error('CURRICULUM_LOAD_FAILED');
    const data=await r.json();
    const targetRows=Object.entries(data.targets).map(([key,x])=>`
      <div class="metricRow">
        <div><b>${safe(label[key]||key)}</b><span>${x.value} itens disponíveis</span></div>
        <div class="metricBar"><i style="width:${Math.min(100,Math.round(x.value/x.target*100))}%"></i></div>
        <strong>${x.done?'✓':`${x.value}/${x.target}`}</strong>
      </div>`).join('');
    const levels=Object.entries(data.byLevel).map(([level,x])=>{
      const fw=data.framework[level]||{};
      const total=Object.values(x).reduce((a,b)=>a+Number(b||0),0);
      return `<article class="sessionItem"><b>${safe(level)} · ${safe(fw.label||'')}</b><p>${safe(fw.goal||'')}</p><small>${total} atividades/conteúdos · ${x.vocabulary} voc · ${x.learning} chunks · ${x.grammar} gram · ${x.listening} escuta · ${x.reading} leitura</small></article>`;
    }).join('');
    const topics=data.topics.slice(0,24).map(x=>`<span>${safe(x.level)} · ${safe(x.topic.replaceAll('-',' '))} · ${x.items}</span>`).join('');
    root.innerHTML=`
      <p class="sub">${data.complete?'O pacote curricular atingiu todas as metas mínimas do Bloco 5.':'O pacote está em expansão.'} Os níveis seguem progressão A1→B2 e o motor usa os pré-requisitos como sinal de prontidão, sem bloquear rigidamente o estudo.</p>
      <div class="curriculumTargets">${targetRows}</div>
      <h3>Mapa por nível</h3>
      <div class="sessionList">${levels}</div>
      <h3>Temas do pacote</h3>
      <div class="principles">${topics}</div>`;
  }catch(error){
    root.innerHTML=`<p class="sub">Não foi possível carregar o mapa curricular (${safe(error.message)}).</p>`;
  }
}

loadCurriculum();