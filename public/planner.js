const $=q=>document.querySelector(q);
const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const api=async(path,options={})=>{const r=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro');return data};
let state=null;
function bar(value,target){const pct=Math.min(100,Math.round((Number(value)||0)/Math.max(1,Number(target)||1)*100));return `<div class="plannerBar"><i style="width:${pct}%"></i></div>`}
function render(){
  const p=state.progress;
  $('#todayProgress').innerHTML=`<p><b>${p.today.minutes} min</b> de ${p.today.target} min</p>${bar(p.today.minutes,p.today.target)}<p class="sub">${p.today.done?'Meta diária concluída.':'Faltam '+Math.max(0,p.today.target-p.today.minutes)+' min.'}</p>`;
  $('#weekProgress').innerHTML=`<p><b>${p.week.minutes} min</b> de ${p.week.targetMinutes} min · <b>${p.week.days}</b> de ${p.week.targetDays} dias</p>${bar(p.week.minutes,p.week.targetMinutes)}<p class="sub">${p.balancedModes}/7 competências apareceram nesta semana.</p>`;
  $('#planMinutes').textContent=`${state.plan.estimatedMinutes} min · alvo ${state.plan.targetMinutes}`;
  $('#planItems').innerHTML=state.plan.items.map((x,i)=>`<article class="plannerItem"><div><span class="eyebrow">${i+1} · prioridade ${x.priority}</span><h3>${safe(x.title)}</h3><p>${safe(x.reason)}</p><p class="plannerMeta">${x.minutes} min</p></div><a class="headerLink" href="${safe(x.route)}">Treinar →</a></article>`).join('');
  const g=p.goals;$('#dailyMinutes').value=g.dailyMinutes;$('#weeklyMinutes').value=g.weeklyMinutes;$('#weeklyDays').value=g.weeklyDays;$('#preferredSessionMinutes').value=g.preferredSessionMinutes;
  const r=state.rewards;$('#xpEconomy').innerHTML=`<div><b>${r.creditedXp}</b><br><span>XP efetivo total</span></div><div><b>${r.rawXp}</b><br><span>XP bruto</span></div><div><b>${r.today.credited}</b><br><span>XP efetivo hoje</span></div><div><b>${r.today.remaining}</b><br><span>margem hoje</span></div>`;$('#xpExplanation').textContent=r.explanation;
  $('#plannerBadges').innerHTML=state.badges.map(x=>`<span class="plannerBadge ${x.unlocked?'unlocked':''}" title="${safe(x.description)}">${x.unlocked?'🏆':'🔒'} ${safe(x.title)}</span>`).join('');
}
async function load(){state=await api('/api/planner/today');render()}
$('#refreshPlan').onclick=load;
$('#goalsForm').onsubmit=async e=>{e.preventDefault();const body={dailyMinutes:Number($('#dailyMinutes').value),weeklyMinutes:Number($('#weeklyMinutes').value),weeklyDays:Number($('#weeklyDays').value),preferredSessionMinutes:Number($('#preferredSessionMinutes').value)};await api('/api/planner/goals',{method:'POST',body:JSON.stringify(body)});$('#goalStatus').textContent='Metas salvas.';await load()};
load();
