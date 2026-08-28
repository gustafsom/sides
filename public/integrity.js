const $=s=>document.querySelector(s);
const fmtBytes=n=>{const v=Number(n||0);if(v<1024)return `${v} B`;if(v<1024**2)return `${(v/1024).toFixed(1)} KB`;return `${(v/1024**2).toFixed(1)} MB`};
const fmtDate=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
async function api(path,options={}){const r=await fetch(path,options);const type=r.headers.get('content-type')||'';const data=type.includes('json')?await r.json():await r.blob();if(!r.ok)throw new Error(data?.error||`HTTP_${r.status}`);return data;}
function card(label,value,state=''){return `<div class="integrityStat"><span>${label}</span><strong class="${state}">${value}</strong></div>`}
async function load(){
  const s=await api('/api/integrity/status');
  $('#statusCards').innerHTML=[card('Banco',s.ok?'Íntegro':'Atenção',s.ok?'good':'bad'),card('Quick check',s.quickCheck?'OK':'Falhou',s.quickCheck?'good':'bad'),card('Backups',s.backups.length),card('Restauração',s.restorePending?'Pendente':'Nenhuma',s.restorePending?'warn':'good')].join('');
  $('#backupList').innerHTML=s.backups.length?s.backups.map(b=>`<div class="backupRow"><div><strong>${b.filename}</strong><div class="backupMeta">${b.kind} · ${fmtBytes(b.size)} · ${fmtDate(b.modifiedAt)}</div></div><button data-download="${b.filename}" class="ghost">Baixar</button><button data-restore="${b.filename}" class="ghost">Restaurar</button></div>`).join(''):'<div class="emptyState">Nenhum backup local encontrado.</div>';
}
async function run(action,button){button.disabled=true;try{return await action()}finally{button.disabled=false}}
$('#checkBtn').addEventListener('click',()=>run(async()=>{await api('/api/integrity/check',{method:'POST'});await load()},$('#checkBtn')));
$('#backupBtn').addEventListener('click',()=>run(async()=>{await api('/api/integrity/backup',{method:'POST'});await load()},$('#backupBtn')));
$('#exportJsonBtn').addEventListener('click',()=>{location.href='/api/export'});
$('#backupList').addEventListener('click',async e=>{
  const d=e.target.closest('[data-download]');if(d){location.href=`/api/integrity/backups/${encodeURIComponent(d.dataset.download)}`;return;}
  const r=e.target.closest('[data-restore]');if(r){
    if(!confirm('Preparar a restauração deste backup? O SIDES só aplicará a troca após reiniciar.'))return;
    const out=await api('/api/integrity/restore-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:r.dataset.restore})});
    $('#restoreNote').textContent=out.restartRequired?'Restauração validada e preparada. Feche e abra novamente o SIDES para aplicar.':'';await load();
  }
});
$('#importJsonInput').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;$('#importNote').textContent='Validando e importando...';
  try{const text=await file.text();const out=await api('/api/integrity/import',{method:'POST',headers:{'Content-Type':'application/json'},body:text});$('#importNote').textContent=`Importação concluída: ${out.importedTables} tabelas. Backup pré-importação criado automaticamente.`;await load();}
  catch(err){$('#importNote').textContent=`Importação não aplicada: ${err.message}`;}finally{e.target.value='';}
});
$('#restoreInput').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;if(!confirm('Validar e preparar este banco para restauração no próximo início?')){e.target.value='';return;}
  $('#restoreNote').textContent='Validando banco...';
  try{const out=await api('/api/integrity/restore',{method:'POST',headers:{'Content-Type':'application/x-sqlite3'},body:await file.arrayBuffer()});$('#restoreNote').textContent=out.restartRequired?'Banco válido. Restauração preparada. Feche e abra novamente o SIDES para aplicar.':'';await load();}
  catch(err){$('#restoreNote').textContent=`Restauração não preparada: ${err.message}`;}finally{e.target.value='';}
});
load().catch(err=>{$('#statusCards').innerHTML=card('Integridade',err.message,'bad')});
