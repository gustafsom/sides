import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { bibleBooks, jwVocabulary } from '../src/jw-content.mjs';
import { completeJwSpeaking, jwOverview, jwSessionPlan, submitBibleBook, submitJwVocabulary } from '../src/jw-service.mjs';

test('JW overview exposes original pack without copied publication text',()=>{
  const db=openDatabase(':memory:');
  const overview=jwOverview(db);
  assert.equal(overview.vocabularyCount,50);
  assert.equal(overview.bibleBooksCount,66);
  assert.equal(overview.openErrors,0);
  assert.match(overview.copyrightBoundary,/does not copy or cache/i);
});

test('JW vocabulary error is resolved by later correct retrieval',()=>{
  const db=openDatabase(':memory:');
  const item=jwVocabulary[0];
  const now=new Date('2026-08-27T12:00:00Z');
  const wrong=submitJwVocabulary(db,{id:item.id,answer:'errado'},now);
  assert.equal(wrong.quality.status,'wrong');
  assert.equal(jwOverview(db).openErrors,1);
  const correct=submitJwVocabulary(db,{id:item.id,answer:item.es},new Date('2026-08-28T12:00:00Z'));
  assert.equal(correct.quality.status,'correct');
  assert.equal(jwOverview(db).openErrors,0);
});

test('Bible-book drill accepts Spanish name from Portuguese prompt',()=>{
  const db=openDatabase(':memory:');
  const item=bibleBooks[0];
  const result=submitBibleBook(db,{id:item.id,mode:'pt-to-es',answer:item.es},new Date('2026-08-27T12:00:00Z'));
  assert.equal(result.quality.status,'correct');
  assert.equal(result.book,item.es);
});

test('JW speaking practice records rubric mastery without storing audio',()=>{
  const db=openDatabase(':memory:');
  const result=completeJwSpeaking(db,{practiceType:'reading',durationMs:90000,ratings:{accuracy:4,naturalness:3,pace:4}},new Date('2026-08-27T12:00:00Z'));
  assert.equal(result.practiceType,'reading');
  assert.ok(result.average>=3);
  assert.ok(db.prepare("SELECT COUNT(*) n FROM skill_mastery WHERE skill_type='jw'").get().n>=4);
});

test('JW session plan mixes vocabulary, Bible books and oral practice',()=>{
  const plan=jwSessionPlan();
  assert.equal(plan.length,5);
  assert.deepEqual(plan.map(x=>x.kind),['jw-vocabulary','jw-bible-book','jw-reading','jw-comment','jw-talk']);
});
