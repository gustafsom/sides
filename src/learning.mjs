export const DAY_MS = 86_400_000;

export function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFKC')
    .replace(/[¿?¡!.,;:()\[\]{}"“”'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLoose(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function answerQuality(input, expected) {
  const candidates = Array.isArray(expected) ? expected : [expected];
  const exact = normalizeText(input);
  const loose = normalizeLoose(input);
  if (!exact) return { status: 'empty', score: 0 };
  for (const candidate of candidates) {
    if (exact === normalizeText(candidate)) return { status: 'correct', score: 1 };
  }
  for (const candidate of candidates) {
    if (loose === normalizeLoose(candidate)) return { status: 'accent', score: 0.8 };
  }
  return { status: 'wrong', score: 0 };
}

export function xpForAttempt({ correct, mode = 'vocabulary', rating = 3, streak = 0 }) {
  const baseByMode = {
    vocabulary: 10,
    grammar: 12,
    listening: 15,
    reading: 15,
    speaking: 18,
    placement: 5
  };
  const base = baseByMode[mode] ?? 10;
  const correctness = correct ? 1 : 0.35;
  const difficulty = Math.max(0.8, Math.min(1.25, Number(rating || 3) / 3));
  const streakBonus = Math.min(1.2, 1 + Math.max(0, streak) * 0.01);
  return Math.max(1, Math.round(base * correctness * difficulty * streakBonus));
}

export function levelFromXp(xp) {
  const safe = Math.max(0, Number(xp || 0));
  return Math.floor(Math.sqrt(safe / 120)) + 1;
}

// Mantido apenas para compatibilidade com bancos/testes V1. Novas revisões usam FSRS em fsrs-adapter.mjs.
export function scheduleReview(state = {}, rating = 3, now = new Date()) {
  const current = {
    intervalDays: Number(state.intervalDays || 0),
    ease: Number(state.ease || 2.35),
    reps: Number(state.reps || 0),
    lapses: Number(state.lapses || 0)
  };
  const r = Math.max(1, Math.min(4, Number(rating || 3)));
  let intervalDays;
  let ease = current.ease;
  let lapses = current.lapses;

  if (r === 1) {
    intervalDays = current.reps === 0 ? 10 / 1440 : Math.max(10 / 1440, current.intervalDays * 0.12);
    ease = Math.max(1.3, ease - 0.2);
    lapses += 1;
  } else if (r === 2) {
    intervalDays = current.reps === 0 ? 0.5 : Math.max(0.5, current.intervalDays * 1.25);
    ease = Math.max(1.3, ease - 0.08);
  } else if (r === 3) {
    intervalDays = current.reps === 0 ? 1 : Math.max(1, current.intervalDays * ease);
  } else {
    intervalDays = current.reps === 0 ? 4 : Math.max(4, current.intervalDays * ease * 1.35);
    ease = Math.min(3.2, ease + 0.08);
  }

  const fuzz = current.reps > 2 && intervalDays > 2 ? 1 + (((current.reps * 17 + r * 13) % 9) - 4) / 100 : 1;
  intervalDays = Math.min(3650, Math.max(10 / 1440, intervalDays * fuzz));
  const dueAt = new Date(now.getTime() + intervalDays * DAY_MS);

  return {
    intervalDays,
    ease,
    reps: current.reps + 1,
    lapses,
    dueAt: dueAt.toISOString(),
    lastReviewAt: now.toISOString(),
    scheduler: 'SIDES-SRS-V1'
  };
}

export function dailyQuest(progress = {}) {
  const goals = {
    reviews: 15,
    grammar: 5,
    listening: 3,
    reading: 1
  };
  const rows = Object.entries(goals).map(([key, target]) => ({
    key,
    target,
    value: Math.min(target, Number(progress[key] || 0)),
    done: Number(progress[key] || 0) >= target
  }));
  return {
    rows,
    completed: rows.every((x) => x.done),
    percent: Math.round(rows.reduce((sum, x) => sum + x.value / x.target, 0) / rows.length * 100)
  };
}

export function selectInterleavedSession({ dueVocabulary = [], learning = [], grammar = [], listening = [], reading = [], limit = 20 }) {
  const lanes = [
    dueVocabulary.map((item) => ({ ...item, kind: 'vocabulary' })),
    learning.map((item) => ({ ...item, kind: item.kind || 'chunk' })),
    grammar.map((item) => ({ ...item, kind: 'grammar' })),
    listening.map((item) => ({ ...item, kind: 'listening' })),
    reading.map((item) => ({ ...item, kind: 'reading' }))
  ];
  const result = [];
  let index = 0;
  while (result.length < limit && lanes.some((lane) => lane.length)) {
    const lane = lanes[index % lanes.length];
    if (lane.length) result.push(lane.shift());
    index += 1;
  }
  return result;
}
