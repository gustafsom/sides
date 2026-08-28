const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function loadPlannerSummary(){
  const root=document.querySelector('#plannerSummary');if(!root)return;
  try{
    const r=await fetch('/api/planner/today');const p=await r.json();if(!r.ok)throw new Error(p.error||'Erro');
    root.innerHTML=`<div class="progressStats"><div class="miniStat"><b>${p.progress.today.minutes}/${p.progress.today.target}</b><span>min hoje</span></div><div class="miniStat"><b>${p.progress.week.days}/${p.progress.week.targetDays}</b><span>dias na semana</span></div><div class="miniStat"><b>${p.rewards.creditedXp}</b><span>XP efetivo</span></div><div class="miniStat"><b>${p.plan.overdue7}</b><span>revisões +7d</span></div></div><div>${p.plan.items.slice(0,3).map((x,i)=>`<div class="metricRow"><div><b>${i+1}. ${safe(x.title)}</b><span>${safe(x.reason)}</span></div><strong>${x.minutes} min</strong></div>`).join('')}</div><p><a href="/planner.html">Abrir planejador completo →</a></p>`;
  }catch(e){root.innerHTML=`<p class="sub">Não foi possível carregar o plano diário: ${safe(e.message)}</p>`}
}
loadPlannerSummary();
