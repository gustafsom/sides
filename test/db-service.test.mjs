import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { dashboard, dailySession, getVocabularyCard, placementItems, submitPlacement, submitVocabulary, updatePreferences } from '../src/service.mjs';

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

test('errors become adaptive mastery signals and resolve after recovery',()=>{
  const db=openDatabase(':memory:');
  const now=new Date('2026-08-27T12:00:00Z');
  const card=getVocabularyCard(db,now);
  submitVocabulary(db,{id:card.id,answer:'resposta errada',rating:1},now);
  let dash=dashboard(db,now);
  assert.equal(dash.insights.openErrors,1);
  assert.ok(dash.insights.weakestSkills.length>=1);
  const retry=new Date('2026-08-28T12:00:00Z');
  submitVocabulary(db,{id:card.id,answer:card.spanish,rating:3},retry);
  dash=dashboard(db,retry);
  assert.equal(dash.insights.openErrors,0);
});

test('unassessed sessions stay at A1 and language variant is validated',()=>{
  const db=openDatabase(':memory:');
  const session=dailySession(db,20);
  assert.ok(session.length>0);
  assert.ok(session.every(x=>x.level==='A1'));
  assert.equal(updatePreferences(db,{spanishVariant:'es-MX'}).spanishVariant,'es-MX');
  assert.equal(dashboard(db).preferences.spanishVariant,'es-MX');
  assert.throws(()=>updatePreferences(db,{spanishVariant:'invalid'}),/SPANISH_VARIANT_INVALID/);
});
