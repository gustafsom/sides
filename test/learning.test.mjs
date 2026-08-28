import test from 'node:test';
import assert from 'node:assert/strict';
import { answerQuality, dailyQuest, levelFromXp, scheduleReview, selectInterleavedSession, xpForAttempt } from '../src/learning.mjs';

test('answerQuality accepts exact Spanish and flags missing accents',()=>{
  assert.equal(answerQuality('mañana','mañana').status,'correct');
  assert.equal(answerQuality('manana','mañana').status,'accent');
  assert.equal(answerQuality('hoy','mañana').status,'wrong');
});

test('scheduleReview expands successful intervals and lapses on again',()=>{
  const now=new Date('2026-08-27T12:00:00Z');
  const first=scheduleReview({},3,now);
  const second=scheduleReview(first,3,now);
  assert.ok(second.intervalDays>first.intervalDays);
  const lapse=scheduleReview(second,1,now);
  assert.ok(lapse.intervalDays<second.intervalDays);
  assert.equal(lapse.lapses,1);
});

test('xp and level are monotonic',()=>{
  assert.ok(xpForAttempt({correct:true,mode:'speaking'})>xpForAttempt({correct:false,mode:'speaking'}));
  assert.ok(levelFromXp(10000)>levelFromXp(100));
});

test('daily quest reports progress',()=>{
  const q=dailyQuest({reviews:15,grammar:5,listening:3,reading:1});
  assert.equal(q.completed,true);assert.equal(q.percent,100);
});

test('interleaving rotates lanes',()=>{
  const s=selectInterleavedSession({dueVocabulary:[{id:1},{id:2}],grammar:[{id:3}],listening:[{id:4}],reading:[{id:5}],limit:5});
  assert.deepEqual(s.map(x=>x.kind),['vocabulary','grammar','listening','reading','vocabulary']);
});
