import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { dashboard, getVocabularyCard, placementItems, submitPlacement, submitVocabulary } from '../src/service.mjs';

test('database seeds and review updates local progress',()=>{
  const db=openDatabase(':memory:');
  assert.ok(db.prepare('SELECT COUNT(*) n FROM vocabulary').get().n>=40);
  assert.equal(placementItems(db).length,12);
  const now=new Date('2026-08-27T12:00:00Z');
  const card=getVocabularyCard(db,now);
  assert.ok(card);
  const result=submitVocabulary(db,{id:card.id,answer:card.spanish,rating:3,responseMs:1000},now);
  assert.equal(result.quality.status,'correct');
  assert.ok(result.xp>0);
  assert.equal(dashboard(db,now).today.attempts,1);
});

test('placement persists a calibrated level',()=>{
  const db=openDatabase(':memory:');
  const items=db.prepare('SELECT * FROM placement_items').all();
  const answers={};
  for(const item of items) answers[item.id]=JSON.parse(item.answers_json)[0];
  const result=submitPlacement(db,{answers},new Date('2026-08-27T12:00:00Z'));
  assert.equal(result.level,'B2');
  assert.equal(dashboard(db).placement.completed,true);
});
