import { createEmptyCard, fsrs, State } from 'ts-fsrs';

export const FSRS_VERSION = '5.4.1';
export const SCHEDULER_ID = `SIDES-FSRS-${FSRS_VERSION}`;

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 3650,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ['1m','10m'],
  relearning_steps: ['10m']
});

const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)));
const iso = (value,fallback) => {
  const d = value ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback : d;
};

function legacyDifficulty(ease=2.35) {
  return clamp(11 - Number(ease || 2.35) * 2.5, 1, 10);
}

export function rowToFsrsCard(row = {}, now = new Date()) {
  const reps = Math.max(0,Number(row.reps || 0));
  const due = iso(row.due_at,now);
  const lastReview = row.last_review_at ? iso(row.last_review_at,now) : undefined;

  if (row.scheduler === SCHEDULER_ID && row.stability != null && row.difficulty != null) {
    return {
      due,
      stability: Math.max(0,Number(row.stability || 0)),
      difficulty: clamp(row.difficulty || 0,0,10),
      elapsed_days: Math.max(0,Number(row.elapsed_days || 0)),
      scheduled_days: Math.max(0,Number(row.scheduled_days || 0)),
      reps,
      lapses: Math.max(0,Number(row.lapses || 0)),
      learning_steps: Math.max(0,Number(row.learning_steps || 0)),
      state: Math.max(0,Number(row.state || 0)),
      last_review: lastReview
    };
  }

  if (reps === 0) return createEmptyCard(now);

  const interval = Math.max(0.1,Number(row.interval_days || 1));
  const fallbackLast = new Date(now.getTime() - interval * 86_400_000);
  return {
    due,
    stability: interval,
    difficulty: legacyDifficulty(row.ease),
    elapsed_days: Math.max(1,Math.round(interval)),
    scheduled_days: Math.max(1,Math.round(interval)),
    reps,
    lapses: Math.max(0,Number(row.lapses || 0)),
    learning_steps: 0,
    state: State.Review,
    last_review: lastReview || fallbackLast
  };
}

export function scheduleFsrs(row = {}, rating = 3, now = new Date()) {
  const grade = Math.max(1,Math.min(4,Number(rating || 3)));
  const card = rowToFsrsCard(row,now);
  const result = scheduler.next(card,now,grade);
  const next = result.card;
  const intervalDays = Math.max(0,(next.due.getTime()-now.getTime())/86_400_000);
  return {
    dueAt: next.due.toISOString(),
    intervalDays,
    stability: Number(next.stability || 0),
    difficulty: Number(next.difficulty || 0),
    elapsedDays: Math.max(0,Number(next.elapsed_days || 0)),
    scheduledDays: Math.max(0,Number(next.scheduled_days || 0)),
    reps: Math.max(0,Number(next.reps || 0)),
    lapses: Math.max(0,Number(next.lapses || 0)),
    learningSteps: Math.max(0,Number(next.learning_steps || 0)),
    state: Math.max(0,Number(next.state || 0)),
    lastReviewAt: next.last_review ? new Date(next.last_review).toISOString() : now.toISOString(),
    scheduler: SCHEDULER_ID
  };
}

export function retrievability(row = {}, now = new Date()) {
  if (Number(row.reps || 0) === 0) return 1;
  try {
    const card = rowToFsrsCard(row,now);
    return clamp(scheduler.get_retrievability(card,now,false),0,1);
  } catch {
    return null;
  }
}

export function stateLabel(state) {
  const value = Number(state || 0);
  if (value === State.Learning) return 'learning';
  if (value === State.Review) return 'review';
  if (value === State.Relearning) return 'relearning';
  return 'new';
}
