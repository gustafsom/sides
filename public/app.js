const $ = (q) => document.querySelector(q);
const api = async (path, options = {}) => {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Erro');
  return data;
};

let dash = null;
let progress = null;
let current = null;
let startedAt = 0;
let mediaRecorder = null;
let audioChunks = [];
let recordingUrl = null;
let guidedSession = null;

const grammarFriendly = {
  'ser-estar': {
    title: 'Ser ou estar?',
    simple: 'Pense em “ser” para dizer quem alguém é, como algo é ou de onde vem. Use “estar” para dizer como alguém está ou onde algo fica.',
    shortcut: 'Identidade ou origem → ser. Estado ou localização → estar.'
  },
  'presente-ar': {
    title: 'Presente dos verbos em -ar',
    simple: 'Primeiro veja quem faz a ação. Em verbos regulares, a terminação muda com a pessoa: yo estudio, tú estudias, ella estudia, nosotros estudiamos, ellos estudian.',
    shortcut: 'Não decore a palavra inteira: ligue a pessoa à terminação.'
  },
  'presente-er-ir': {
    title: 'Presente dos verbos em -er e -ir',
    simple: 'A lógica é parecida com os verbos em -ar: a parte final muda conforme quem faz a ação. Compare yo como / vivo, tú comes / vives, nosotros comemos / vivimos.',
    shortcut: 'Identifique primeiro o sujeito; depois escolha a terminação.'
  },
  articulos: {
    title: 'El, la, los, las, un, una…',
    simple: 'O artigo acompanha a palavra. Se o substantivo muda de masculino para feminino ou de singular para plural, o artigo acompanha essa mudança.',
    shortcut: 'Olhe para gênero e quantidade: el libro, la puerta, los libros, las puertas.'
  },
  'preterito-indefinido': {
    title: 'Algo aconteceu e terminou',
    simple: 'Use este passado quando você conta um fato concluído em um tempo que já terminou: ontem, na semana passada, em 2025.',
    shortcut: 'Ayer / anoche / la semana pasada → pense em ação concluída.'
  },
  'preterito-perfecto': {
    title: 'Passado ainda ligado ao agora',
    simple: 'Use esta forma quando o que aconteceu ainda está conectado ao período atual, como “hoje”, “esta semana”, “já” ou “ainda não”.',
    shortcut: 'Hoy he trabajado; ayer trabajé. O marcador de tempo ajuda a escolher.'
  },
  imperfecto: {
    title: 'Como era ou o que acontecia',
    simple: 'Use o imperfecto para descrever cenário, hábito ou uma ação que estava acontecendo no passado, sem destacar seu fim.',
    shortcut: '“Quando eu era…”, “antes eu sempre…”, “naquele momento eu estava…” → imperfecto.'
  },
  'por-para': {
    title: 'Por ou para?',
    simple: '“Para” costuma apontar para destino, objetivo ou destinatário. “Por” costuma explicar motivo, caminho, meio ou troca.',
    shortcut: 'Para quê / para onde? → para. Por quê / por onde / por meio de quê? → por.'
  },
  'subjuntivo-voluntad': {
    title: 'Quando algo é desejado, pedido ou necessário',
    simple: 'Depois de expressões como “quiero que”, “espero que” ou “necesito que”, a segunda ação ainda não é apresentada como um fato; é algo desejado ou esperado.',
    shortcut: 'Quero que você faça → quiero que hagas.'
  },
  'subjuntivo-opinion': {
    title: 'Dúvida, possibilidade ou opinião negada',
    simple: 'Quando você não apresenta a informação como certa — por dúvida, possibilidade ou negação — o espanhol frequentemente usa o subjuntivo.',
    shortcut: 'No creo que…, dudo que…, es posible que… → espere subjuntivo.'
  },
  condicional: {
    title: 'Imagine uma situação e o resultado',
    simple: 'Para hipóteses pouco prováveis, pense na estrutura “se fosse assim, eu faria aquilo”. A primeira parte imagina a situação; a segunda mostra o resultado.',
    shortcut: 'Si tuviera tiempo, viajaría más.'
  },
  pronombres: {
    title: 'Evite repetir o objeto',
    simple: 'Lo, la, los e las podem substituir algo que já foi mencionado. Assim, você evita repetir o substantivo inteiro.',
    shortcut: '¿El libro? Ya lo compré. ¿Las llaves? No las encuentro.'
  },
  conectores: {
    title: 'Palavras que ligam ideias',
    simple: 'Use conectores para deixar o raciocínio claro: “sin embargo” mostra contraste, “por lo tanto” mostra consequência e “además” acrescenta informação.',
    shortcut: 'Pergunte qual relação existe entre as duas ideias: contraste, consequência ou adição.'
  },
  'hipotesis-pasadas': {
    title: 'Imagine um passado diferente',
    simple: 'Esta estrutura serve para falar de algo que não aconteceu e imaginar qual teria sido o resultado.',
    shortcut: 'Si hubiera sabido…, habría avisado… = Se eu tivesse sabido…, teria avisado…'
  },
  'estilo-indirecto': {
    title: 'Contando depois o que alguém disse',
    simple: 'Ao relatar mais tarde uma fala, o ponto de vista do tempo pode mudar. Por isso “estoy” pode virar “estaba” e “iré” pode virar “iría”.',
    shortcut: 'Pense: estou contando agora algo que foi dito antes.'
  },
  concesivas: {
    title: 'Reconheça o obstáculo e continue',
    simple: 'Expressões como “aunque” ou “por más que” apresentam uma dificuldade sem abandonar a ideia principal.',
    shortcut: 'Aunque sea difícil, lo intentaré = Mesmo que seja difícil, vou tentar.'
  }
};

async function refresh() {
  [dash, progress] = await Promise.all([api('/api/dashboard'), api('/api/progress?days=30')]);
  renderDashboard();
  renderProgress();
}

function renderDashboard() {
  $('#placementBanner').classList.toggle('hidden', dash.placement.completed);
  const pressure = dash.reviewPressure?.freezeNew ? ' Há muitas revisões antigas: conteúdo novo foi temporariamente reduzido para recuperar retenção.' : '';
  $('#heroText').textContent = dash.placement.completed
    ? `Nível estimado ${dash.placement.level}. Há ${dash.dueTotal} revisões/itens vencidos.${pressure}`
    : 'Comece pelo diagnóstico rápido. Depois, use a Trilha de hoje: ela alterna vocabulário, gramática, escuta, leitura, frases e contraste com o português conforme seu progresso.';

  const stats = [
    ['XP', dash.total.xp], ['Nível', dash.total.level], ['Sequência', `${dash.total.streak} dia(s)`],
    ['Precisão', `${dash.total.correctRate}%`], ['Pendentes', dash.dueTotal], ['Erros abertos', dash.insights.openErrors]
  ];
  $('#stats').innerHTML = stats.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
  $('#achievements').innerHTML = dash.achievements.map(a => `<span title="${safe(a.description)}">${a.unlocked ? '🏆' : '🔒'} ${safe(a.title)}</span>`).join('');
  $('#adaptiveFocus').innerHTML = dash.insights.attention?.length
    ? `<p class="sub">Prioridade calculada com domínio, erros abertos, erros recentes e tendência:</p><div class="principles">${dash.insights.attention.slice(0, 5).map(x => `<span>${safe(x.title)} · atenção ${x.attentionScore}/100</span>`).join('')}</div>`
    : '<p class="sub">Pratique algumas atividades para o sistema identificar padrões confiáveis.</p>';
  $('#quest').innerHTML = dash.quest.rows.map(x => `<div class="questRow"><div><b>${label(x.key)}</b><div class="bar"><i style="width:${Math.round(x.value / x.target * 100)}%"></i></div></div><span>${x.value}/${x.target}</span></div>`).join('') + `<p class="footerNote">${dash.quest.percent}% da missão concluída. A sequência conta consistência, não perfeição.</p>`;
  $('#variantSelect').value = dash.preferences.spanishVariant || 'es';
  $('#variantSelect').onchange = async e => {
    await api('/api/preferences', { method: 'POST', body: JSON.stringify({ spanishVariant: e.target.value }) });
    await refresh();
  };
}

function renderProgress() {
  const s = progress.summary;
  const t = progress.trend;
  $('#progressStats').innerHTML = [
    ['Atividades', s.attempts], ['Precisão 30d', `${s.accuracy}%`], ['Dias ativos', s.activeDays],
    ['Memórias maduras', s.mature], ['Retenção estimada', s.averageRetrievability == null ? '—' : `${s.averageRetrievability}%`], ['Atrasadas +7d', s.overdue7]
  ].map(([l, v]) => `<div class="miniStat"><b>${v}</b><span>${l}</span></div>`).join('');

  const delta = t.accuracyDelta;
  const trendText = delta == null ? 'Tendência ainda sem amostra' : delta > 3 ? `↑ precisão +${delta} p.p.` : delta < -3 ? `↓ precisão ${delta} p.p.` : '→ precisão estável';
  $('#trendBadge').textContent = trendText;
  $('#trendBadge').className = `trendBadge ${delta == null ? 'neutral' : delta > 3 ? 'up' : delta < -3 ? 'down' : 'neutral'}`;

  $('#attentionList').innerHTML = progress.attention.length
    ? progress.attention.map(x => `<article class="attentionItem ${safe(x.tier)}"><div class="attentionScore"><b>${x.attentionScore}</b><small>/100</small></div><div class="attentionBody"><div class="attentionHead"><h3>${safe(x.title)}</h3><span>${safe(x.tier === 'urgent' ? 'Prioridade alta' : x.tier === 'focus' ? 'Foco recomendado' : x.tier === 'watch' ? 'Observar' : 'Estável')}</span></div><p><b>Por que apareceu:</b> ${safe(x.reasons.join(' · '))}</p><p>${safe(x.explanation)}</p><p class="recommend"><b>Próxima ação:</b> ${safe(x.recommendation)}</p></div><button class="ghost" data-focus-type="${safe(x.skillType)}" data-focus-key="${safe(x.skillKey)}">Treinar</button></article>`).join('')
    : '<p class="sub">Ainda não há dados suficientes para calcular prioridades confiáveis.</p>';

  const rows = progress.activity.slice(-30);
  const maxXp = Math.max(1, ...rows.map(x => x.xp));
  $('#activityChart').innerHTML = rows.length
    ? rows.map(x => `<div class="activityDay" title="${safe(x.day)} · ${x.xp} XP · ${x.accuracy}%"><i style="height:${Math.max(5, Math.round(x.xp / maxXp * 100))}%"></i><small>${safe(x.day.slice(8))}</small></div>`).join('')
    : '<p class="sub">Sem atividade neste período.</p>';
  $('#activityNote').textContent = `Últimos 7 dias: ${t.recent.attempts} atividades, ${t.recent.accuracy}% de precisão. Período anterior: ${t.previous.attempts} atividades, ${t.previous.accuracy}% de precisão.`;
  $('#modePerformance').innerHTML = progress.modes.length
    ? progress.modes.map(x => `<div class="metricRow"><div><b>${label(x.mode)}</b><span>${x.attempts} tentativas</span></div><div class="metricBar"><i style="width:${x.accuracy}%"></i></div><strong>${x.accuracy}%</strong></div>`).join('')
    : '<p class="sub">Ainda sem dados por habilidade.</p>';

  const sr = progress.srs;
  $('#srsHealth').innerHTML = `<div class="healthGrid"><span><b>${sr.new}</b> novos</span><span><b>${sr.learning}</b> aprendendo</span><span><b>${sr.review}</b> revisão</span><span><b>${sr.relearning}</b> reaprendendo</span></div><p class="footerNote">${sr.due} item(ns) vencido(s); ${sr.overdue7} estão atrasados há mais de 7 dias. Quando a dívida de revisão fica alta, o CURESP reduz itens novos.</p>`;
  $('#errorBreakdown').innerHTML = progress.errorBreakdown.length
    ? progress.errorBreakdown.map(x => `<div class="errorRow"><span>${safe(errorLabel(x.kind))}</span><b>${x.count}</b></div>`).join('')
    : '<p class="sub">Nenhum padrão de erro registrado no período.</p>';
}

function label(k) {
  return { reviews: 'Revisões', vocabulary: 'Vocabulário', grammar: 'Gramática', listening: 'Escuta', reading: 'Leitura', speaking: 'Fala', chunk: 'Frases', contrast: 'PT × ES' }[k] || k;
}

function errorLabel(k) {
  return { wrong: 'Resposta incorreta', accent: 'Acentuação/grafia', empty: 'Sem resposta', comprehension: 'Compreensão', self_assessed: 'Autoavaliação', self_assessed_review: 'Revisar fala' }[k] || k.replaceAll('_', ' ');
}

function inGuidedSession() {
  return Boolean(guidedSession?.active);
}

function updateTrailHeader() {
  const progressBox = $('#trailProgress');
  const backBtn = $('#backBtn');
  if (!progressBox || !backBtn) return;

  if (!inGuidedSession()) {
    progressBox.classList.add('hidden');
    backBtn.textContent = '← Painel';
    return;
  }

  const total = guidedSession.items.length;
  const stepNumber = Math.min(total, guidedSession.index + 1);
  const step = guidedSession.items[guidedSession.index];
  $('#modeLabel').textContent = `Trilha de hoje · ${label(step?.kind || '')}`;
  $('#trailProgressText').textContent = `Passo ${stepNumber} de ${total}`;
  $('#trailProgressFill').style.width = `${Math.round(stepNumber / Math.max(1, total) * 100)}%`;
  progressBox.classList.remove('hidden');
  backBtn.textContent = '← Sair da trilha';
}

function showPractice(mode, title) {
  $('#dashboardView').classList.add('hidden');
  $('#practiceView').classList.remove('hidden');
  $('#modeLabel').textContent = 'Treino rápido';
  $('#practiceTitle').textContent = title;
  $('#xpToast').textContent = '';
  $('#practiceCard').innerHTML = '<p>Carregando...</p>';
  startedAt = performance.now();
  updateTrailHeader();
  return mode;
}

function back() {
  stopRecording();
  guidedSession = null;
  $('#practiceView').classList.add('hidden');
  $('#dashboardView').classList.remove('hidden');
  updateTrailHeader();
  refresh();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function feedbackClass(status) {
  return status === 'correct' ? 'correct' : status === 'accent' ? 'accent' : 'wrong';
}

function safe(s) {
  return String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function speak(text, rate = 1) {
  if (!('speechSynthesis' in window)) return alert('Seu navegador não oferece síntese de voz.');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = dash?.preferences?.spanishVariant || 'es';
  u.rate = rate;
  const voices = speechSynthesis.getVoices();
  const pref = (dash?.preferences?.spanishVariant || 'es').toLowerCase();
  u.voice = voices.find(v => v.lang?.toLowerCase() === pref) || voices.find(v => v.lang?.toLowerCase().startsWith('es')) || null;
  speechSynthesis.speak(u);
}

function xpToast(xp) {
  $('#xpToast').textContent = `+${xp} XP`;
}

function explanationHtml(help) {
  if (!help) return '';
  return `<details class="explain" open><summary>Entender o correto</summary><h4>${safe(help.title || 'Explicação')}</h4><p>${safe(help.explanation || '')}</p>${help.example ? `<p class="example">${safe(help.example)}</p>` : ''}${help.tip ? `<p><b>Como praticar:</b> ${safe(help.tip)}</p>` : ''}${help.recommendation ? `<p><b>Como praticar:</b> ${safe(help.recommendation)}</p>` : ''}</details>`;
}

function grammarExplanationHtml(skill, data) {
  const friendly = grammarFriendly[skill];
  const title = friendly?.title || data.guidance?.title || 'Entenda a ideia';
  const simple = friendly?.simple || data.guidance?.explanation || data.explanation || 'Observe a frase completa e compare com a resposta esperada.';
  const shortcut = friendly?.shortcut || data.guidance?.recommendation || 'Leia a frase correta em voz alta e crie um exemplo parecido.';
  const practice = data.guidance?.recommendation && data.guidance.recommendation !== shortcut ? `<p><b>Pratique assim:</b> ${safe(data.guidance.recommendation)}</p>` : '';
  return `<div class="grammarCoach"><span class="coachLabel">Em palavras simples</span><h4>${safe(title)}</h4><p>${safe(simple)}</p><p class="memoryTip"><b>Atalho mental:</b> ${safe(shortcut)}</p>${practice}${data.explanation && data.explanation !== simple ? `<details class="ruleDetails"><summary>Ver regra resumida</summary><p>${safe(data.explanation)}</p></details>` : ''}</div>`;
}

function nextButtonLabel(fallback = 'Próxima') {
  return inGuidedSession() ? 'Continuar trilha →' : fallback;
}

function continueAfterActivity(fallback, delay = 0) {
  const action = () => inGuidedSession() ? advanceGuidedSession() : fallback();
  if (delay > 0) setTimeout(action, delay); else action();
}

function noItem(message) {
  const guided = inGuidedSession();
  $('#practiceCard').innerHTML = `<p class="prompt">${safe(message)}</p><p class="sub">${guided ? 'Este passo não tem item disponível agora. Você pode seguir sem perder o restante da trilha.' : 'Volte ao painel e escolha outro foco.'}</p><div class="actions"><button id="noItemNext">${guided ? 'Continuar trilha →' : 'Voltar ao painel'}</button></div>`;
  $('#noItemNext').onclick = guided ? advanceGuidedSession : back;
}

async function vocabulary() {
  showPractice('vocabulary', 'Vocabulário em contexto');
  const { item } = await api('/api/vocabulary/next');
  current = item;
  if (!item) return noItem('Tudo revisado por agora 🎯');
  $('#practiceCard').innerHTML = `<span class="eyebrow">${safe(item.level)} · ${safe(item.tags)}</span><p class="prompt">${safe(item.portuguese)}</p><p class="sub">Digite em espanhol antes de revelar.</p><input id="answer" autocomplete="off" autofocus><div class="actions"><button id="check">Verificar</button><button id="hear" class="ghost">Ouvir exemplo</button></div><div id="result"></div>`;
  $('#hear').onclick = () => speak(item.example_es, .9);
  $('#check').onclick = checkVocabulary;
  $('#answer').onkeydown = e => { if (e.key === 'Enter') checkVocabulary(); };
  $('#answer').focus();
}

async function checkVocabulary() {
  const answer = $('#answer').value;
  const prelim = await api('/api/vocabulary/check', { method: 'POST', body: JSON.stringify({ id: current.id, answer }) });
  const result = $('#result');
  result.innerHTML = `<div class="feedback ${feedbackClass(prelim.quality.status)}"><b>${prelim.quality.status === 'correct' ? 'Correto' : prelim.quality.status === 'accent' ? 'Quase: confira acentos' : 'Resposta esperada'}</b><p>${safe(prelim.expected)} — ${safe(prelim.translation)}</p><p>${safe(prelim.example)}</p></div>${explanationHtml(prelim.help)}<p class="sub">Agora avalie o esforço de recuperação, não apenas o acerto.</p><div class="actions ratings"><button class="again" data-r="1">Errei</button><button class="hard" data-r="2">Difícil</button><button class="good" data-r="3">Bom</button><button class="easy" data-r="4">Fácil</button></div>`;
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = async () => {
    const data = await api('/api/vocabulary/review', { method: 'POST', body: JSON.stringify({ id: current.id, answer, rating: Number(b.dataset.r), responseMs: Math.round(performance.now() - startedAt) }) });
    xpToast(data.xp);
    continueAfterActivity(vocabulary, 220);
  });
  $('#check').disabled = true;
}

async function learning(kind = 'chunk', title = kind === 'chunk' ? 'Frases e chunks' : 'Português × espanhol', skill = null) {
  showPractice(kind, title);
  const qp = new URLSearchParams({ kind });
  if (skill) qp.set('skill', skill);
  const { item } = await api(`/api/learning/next?${qp}`);
  current = item;
  if (!item) return noItem('Nada vencido neste foco agora.');
  $('#practiceCard').innerHTML = `<span class="eyebrow">${safe(item.level)} · ${safe(item.kind)}</span><p class="prompt">${safe(item.prompt)}</p><input id="answer" autocomplete="off" autofocus><button id="check">Responder</button><div id="result"></div>`;
  $('#check').onclick = () => checkLearning(kind, title, skill);
  $('#answer').onkeydown = e => { if (e.key === 'Enter') checkLearning(kind, title, skill); };
  $('#answer').focus();
}

async function checkLearning(kind, title, skill) {
  const answer = $('#answer').value;
  const data = await api('/api/learning/answer', { method: 'POST', body: JSON.stringify({ id: current.id, kind, answer, responseMs: Math.round(performance.now() - startedAt) }) });
  xpToast(data.xp);
  $('#result').innerHTML = `<div class="feedback ${feedbackClass(data.quality.status)}"><b>${data.quality.status === 'correct' ? 'Correto' : 'Forma trabalhada'}</b><p>${safe(data.expected)}</p><p>${safe(data.example)}</p></div>${explanationHtml({ title: data.guidance?.title || 'Por que esta forma?', explanation: data.explanation, example: data.example, recommendation: data.guidance?.recommendation })}<div class="actions" style="margin-top:14px"><button id="next">${nextButtonLabel('Próximo')}</button></div>`;
  $('#next').onclick = () => continueAfterActivity(() => learning(kind, title, skill));
  $('#check').disabled = true;
}

async function grammar(skill = null) {
  showPractice('grammar', 'Gramática em contexto');
  const qp = skill ? `?skill=${encodeURIComponent(skill)}` : '';
  const { item } = await api(`/api/grammar/next${qp}`);
  current = item;
  if (!item) return noItem('Nenhum exercício de gramática disponível neste foco.');
  $('#practiceCard').innerHTML = `<span class="eyebrow">${safe(item.level)} · ${safe(item.skill)}</span><p class="prompt">${safe(item.prompt)}</p><p class="sub">Complete a frase do jeito que parece mais natural.</p><input id="answer" autocomplete="off" autofocus><button id="check">Responder</button><div id="result"></div>`;
  $('#check').onclick = () => checkGrammar(skill);
  $('#answer').onkeydown = e => { if (e.key === 'Enter') checkGrammar(skill); };
  $('#answer').focus();
}

async function checkGrammar(skill) {
  const data = await api('/api/grammar/answer', { method: 'POST', body: JSON.stringify({ id: current.id, answer: $('#answer').value, responseMs: Math.round(performance.now() - startedAt) }) });
  xpToast(data.xp);
  $('#result').innerHTML = `<div class="feedback ${feedbackClass(data.quality.status)}"><b>${data.quality.status === 'correct' ? 'Correto' : 'Vamos entender esta escolha'}</b><p>Resposta: ${safe(data.expected.join(' / '))}</p></div>${grammarExplanationHtml(current.skill || skill, data)}<div class="actions" style="margin-top:14px"><button id="next">${nextButtonLabel('Próxima')}</button></div>`;
  $('#next').onclick = () => continueAfterActivity(() => grammar(skill));
  $('#check').disabled = true;
}

async function listening() {
  showPractice('listening', 'Ditado e compreensão oral');
  const { item } = await api('/api/listening/next');
  current = item;
  if (!item) return noItem('Nenhum áudio disponível neste nível agora.');
  $('#practiceCard').innerHTML = `<span class="eyebrow">${safe(item.level)}</span><p class="prompt">Escute sem ler.</p><div class="actions"><button id="playSlow">0,75×</button><button id="play">1×</button><button id="playFast">1,15×</button></div><textarea id="answer" placeholder="Escreva o que você ouviu..."></textarea><button id="check">Verificar ditado</button><div id="result"></div>`;
  $('#playSlow').onclick = () => speak(item.text, .75);
  $('#play').onclick = () => speak(item.text, 1);
  $('#playFast').onclick = () => speak(item.text, 1.15);
  $('#check').onclick = checkListening;
  setTimeout(() => speak(item.text, .9), 250);
}

async function checkListening() {
  const data = await api('/api/listening/answer', { method: 'POST', body: JSON.stringify({ id: current.id, answer: $('#answer').value, responseMs: Math.round(performance.now() - startedAt) }) });
  xpToast(data.xp);
  $('#result').innerHTML = `<div class="feedback ${feedbackClass(data.quality.status)}"><b>Texto ouvido</b><p>${safe(data.expected)}</p><p>${safe(data.translation)}</p></div>${explanationHtml(data.help)}<div class="actions" style="margin-top:14px"><button id="next">${nextButtonLabel('Próxima')}</button><button id="shadow" class="ghost">Ouvir e repetir</button></div>`;
  $('#next').onclick = () => continueAfterActivity(listening);
  $('#shadow').onclick = () => speak(data.expected, .82);
  $('#check').disabled = true;
}

async function reading() {
  showPractice('reading', 'Leitura com recuperação');
  const { item } = await api('/api/reading/next');
  current = item;
  if (!item) return noItem('Nenhum texto disponível neste nível agora.');
  $('#practiceCard').innerHTML = `<span class="eyebrow">${safe(item.level)}</span><h2>${safe(item.title)}</h2><div class="reading">${safe(item.body)}</div><div id="qs">${item.questions.map(q => `<div class="question"><label>${safe(q.q)}</label><input data-q="${q.index}" autocomplete="off"></div>`).join('')}</div><button id="check">Corrigir</button><div id="result"></div>`;
  $('#check').onclick = checkReading;
}

async function checkReading() {
  const answers = [...document.querySelectorAll('[data-q]')].map(x => x.value);
  const data = await api('/api/reading/answer', { method: 'POST', body: JSON.stringify({ id: current.id, answers, responseMs: Math.round(performance.now() - startedAt) }) });
  xpToast(data.xp);
  $('#result').innerHTML = `<div class="feedback ${data.correct >= Math.ceil(data.total * .7) ? 'correct' : 'wrong'}"><b>${data.correct}/${data.total} respostas adequadas</b>${data.details.map(x => `<p>${safe(x.q)}<br><small>Exemplo: ${safe(x.expected[0])}</small></p>`).join('')}</div>${explanationHtml(data.guidance)}<div class="actions" style="margin-top:14px"><button id="next">${nextButtonLabel('Próximo texto')}</button></div>`;
  $('#next').onclick = () => continueAfterActivity(reading);
  $('#check').disabled = true;
}

async function speaking() {
  showPractice('speaking', 'Shadowing e produção oral');
  const { item } = await api('/api/listening/next');
  current = item;
  if (!item) return noItem('Nenhuma frase de fala disponível agora.');
  $('#practiceCard').innerHTML = `<span class="eyebrow">${safe(item.level)}</span><p class="prompt">${safe(item.text)}</p><p class="sub">1) Ouça. 2) Repita junto. 3) Grave sozinho. 4) Compare ritmo, clareza e entonação.</p><div class="actions"><button id="hear">Ouvir</button><button id="record" class="ghost">● Gravar</button><button id="stop" class="ghost" disabled>Parar</button><button id="done" disabled>Concluir repetição</button></div><div id="recordings"></div><p class="footerNote">A análise automática de inteligibilidade fica no módulo local Whisper. O áudio não é enviado para serviços externos.</p>`;
  $('#hear').onclick = () => speak(item.text, .82);
  $('#record').onclick = startRecording;
  $('#stop').onclick = stopRecording;
  $('#done').onclick = completeSpeaking;
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) return alert('Microfone não disponível neste navegador.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = URL.createObjectURL(blob);
    $('#recordings').innerHTML = `<div class="feedback"><b>Sua gravação</b><audio controls src="${recordingUrl}"></audio><p>Compare com o modelo e repita até a fala ficar confortável.</p></div>`;
    if ($('#done')) $('#done').disabled = false;
    stream.getTracks().forEach(t => t.stop());
  };
  mediaRecorder.start();
  $('#record').disabled = true;
  $('#stop').disabled = false;
  $('#record').textContent = 'Gravando…';
}

async function completeSpeaking() {
  const data = await api('/api/speaking/complete', { method: 'POST', body: JSON.stringify({ id: current.id, effort: 3, responseMs: Math.round(performance.now() - startedAt) }) });
  xpToast(data.xp);
  if ($('#done')) $('#done').disabled = true;
  continueAfterActivity(speaking, 250);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  mediaRecorder = null;
  const r = $('#record');
  const s = $('#stop');
  if (r) { r.disabled = false; r.textContent = '● Gravar'; }
  if (s) s.disabled = true;
}

async function placement() {
  guidedSession = null;
  showPractice('placement', 'Diagnóstico de nível');
  const { items } = await api('/api/placement');
  current = items;
  $('#practiceCard').innerHTML = `<p class="sub">Sem consulta. Marque a resposta que parece natural. O objetivo é calibrar, não obter uma nota.</p><div class="sessionList">${items.map((x, i) => `<div class="sessionItem" style="display:block"><b>${i + 1}. ${safe(x.prompt)}</b><div class="options">${x.options.map(o => `<label><input type="radio" name="p${x.id}" value="${safe(o)}"><span>${safe(o)}</span></label>`).join('')}</div></div>`).join('')}</div><button id="finish">Calibrar nível</button><div id="result"></div>`;
  $('#finish').onclick = submitPlacement;
}

async function submitPlacement() {
  const answers = {};
  for (const x of current) {
    const selected = document.querySelector(`input[name=p${x.id}]:checked`);
    if (selected) answers[x.id] = selected.value;
  }
  const data = await api('/api/placement', { method: 'POST', body: JSON.stringify({ answers }) });
  xpToast(data.xp);
  $('#result').innerHTML = `<div class="feedback correct"><b>Nível inicial estimado: ${safe(data.level)}</b><p>${data.correct}/${data.total} itens corretos. Esse nível é apenas o ponto de partida; o desempenho nas sessões ajustará a dificuldade.</p></div><div class="actions" style="margin-top:14px"><button id="go">Ir para o painel</button></div>`;
  $('#go').onclick = back;
  $('#finish').disabled = true;
}

async function session() {
  guidedSession = null;
  showPractice('session', 'Trilha de hoje');
  const { items } = await api('/api/session?limit=12');
  if (!items.length) return noItem('Sua trilha está em dia.');

  guidedSession = { items, index: -1, active: false };
  const kinds = [...new Set(items.map(x => label(x.kind)))];
  $('#practiceCard').innerHTML = `<span class="eyebrow">Sessão intercalada</span><p class="prompt">${items.length} passos, alternando habilidades.</p><p class="sub">Hoje vamos misturar ${safe(kinds.join(', '))}. Você não precisa escolher a próxima tela: o CURESP conduz cada etapa automaticamente.</p><div class="sessionList">${items.map((x, i) => `<div class="sessionItem" data-kind="${safe(x.kind)}"><span class="sessionStep">${i + 1}</span><span class="sessionKind">${safe(label(x.kind))}</span><span class="sessionLevel">${safe(x.level || '')}</span></div>`).join('')}</div><div class="actions" style="margin-top:18px"><button id="begin">Começar trilha</button><button id="cancelTrail" class="ghost">Voltar ao painel</button></div>`;
  $('#begin').onclick = () => {
    guidedSession.active = true;
    guidedSession.index = -1;
    advanceGuidedSession();
  };
  $('#cancelTrail').onclick = back;
}

function advanceGuidedSession() {
  if (!guidedSession?.active) return;
  stopRecording();
  guidedSession.index += 1;
  if (guidedSession.index >= guidedSession.items.length) return finishGuidedSession();
  const step = guidedSession.items[guidedSession.index];
  startSessionStep(step);
}

function startSessionStep(step) {
  if (!step) return advanceGuidedSession();
  if (step.kind === 'grammar') return grammar(step.skill || null);
  if (step.kind === 'chunk') return learning('chunk', 'Frases e chunks', step.skill || null);
  if (step.kind === 'contrast') return learning('contrast', 'Português × espanhol', step.skill || null);
  if (step.kind === 'listening') return listening();
  if (step.kind === 'reading') return reading();
  if (step.kind === 'speaking') return speaking();
  return vocabulary();
}

function finishGuidedSession() {
  const completed = guidedSession;
  guidedSession = { ...completed, active: false, completed: true };
  $('#modeLabel').textContent = 'Trilha de hoje';
  $('#practiceTitle').textContent = 'Sessão concluída';
  $('#backBtn').textContent = '← Painel';
  $('#trailProgress').classList.remove('hidden');
  $('#trailProgressFill').style.width = '100%';
  $('#trailProgressText').textContent = `${completed.items.length} de ${completed.items.length}`;
  $('#practiceCard').innerHTML = `<span class="eyebrow">Concluído</span><p class="prompt">Boa sessão. Você treinou habilidades diferentes sem ficar preso ao mesmo tipo de exercício.</p><p class="sub">O desempenho registrado nesta trilha será usado para ajustar revisões, pontos fracos e a próxima sessão.</p><div class="actions"><button id="trailHome">Voltar ao painel</button><button id="trailAgain" class="ghost">Montar outra trilha</button></div>`;
  $('#trailHome').onclick = back;
  $('#trailAgain').onclick = session;
  refresh().catch(() => {});
}

function focusPractice(type, key) {
  guidedSession = null;
  if (type === 'grammar') return grammar(key);
  if (type === 'chunk' || type === 'contrast') return learning(type, type === 'chunk' ? 'Frases e chunks' : 'Português × espanhol', key);
  if (type === 'listening') return listening();
  if (type === 'reading') return reading();
  if (type === 'speaking') return speaking();
  if (type === 'jw') { location.href = '/jw.html'; return; }
  return vocabulary();
}

document.addEventListener('click', e => {
  const start = e.target.closest('[data-start-session]');
  if (start) { session(); return; }

  const focus = e.target.closest('[data-focus-type]');
  if (focus) { focusPractice(focus.dataset.focusType, focus.dataset.focusKey); return; }

  const v = e.target.closest('[data-view]')?.dataset.view;
  if (!v) return;
  guidedSession = null;
  ({ vocabulary, chunk: () => learning('chunk'), contrast: () => learning('contrast'), grammar, listening, reading, speaking, placement }[v] || (() => {}))();
});

$('#backBtn').onclick = back;
$('#startSession').onclick = session;
$('#exportBtn').onclick = () => location.href = '/api/export';

refresh().catch(err => { $('#heroText').textContent = `Falha ao carregar o painel: ${err.message}`; });
