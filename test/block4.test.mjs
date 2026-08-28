import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { dashboard, getVocabularyCard, nextLearningItem, progressDashboard, randomGrammar, submitGrammar, submitLearningItem, submitVocabulary } from '../src/service.mjs';
import { SCHEDULER_ID, scheduleFsrs } from '../src/fsrs-adapter.mjs';

test('V3 schema adds FSRS state and adaptive event history without changing existing tables',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V3');
  const columns=new Set(db.prepare('PRAGMA table_info(srs)').all().map(x=>x.name));
  for(const name of ['stability','difficulty','elapsed_days','scheduled_days','learning_steps','state']) assert.ok(columns.has(name));
  assert.ok(db.prepare('SELECT COUNT(*) n FROM learning_items').get().n>=20);
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='skill_events'").get());
});

test('FSRS 5.4.1 becomes the scheduler while accepting legacy V1 card state',()=>{
  const now=new Date('2026-08-28T12:00:00Z');
  const migrated=scheduleFsrs({due_at:'2026-08-27T12:00:00Z',interval_days:4,ease:2.35,reps:3,lapses:0,last_review_at:'2026-08-23T12:00:00Z',scheduler:'SIDES-SRS-V1'},3,now);
  assert.equal(migrated.scheduler,SCHEDULER_ID);
  assert.ok(migrated.stability>0);
  assert.ok(migrated.difficulty>0);
  assert.ok(new Date(migrated.dueAt)>now);
});

test('vocabulary reviews persist FSRS fields and preserve progress flow',()=>{
  const db=openDatabase(':memory:');
  const now=new Date('2026-08-28T12:00:00Z');
  const card=getVocabularyCard(db,now);
  const result=submitVocabulary(db,{id:card.id,answer:card.spanish,rating:3},now);
  const state=db.prepare("SELECT * FROM srs WHERE item_type='vocabulary' AND item_id=?").get(card.id);
  assert.equal(state.scheduler,SCHEDULER_ID);
  assert.ok(Number(state.stability)>0);
  assert.ok(Number(state.reps)>=1);
  assert.equal(result.scheduler,SCHEDULER_ID);
});

test('chunks and Portuguese-Spanish contrasts give explanations and feed attention priorities',()=>{
  const db=openDatabase(':memory:');
  const first=nextLearningItem(db,'contrast',new Date('2026-08-28T12:00:00Z'));
  assert.ok(first);
  assert.equal('answer' in first,false);
  let result;
  for(let i=0;i<3;i++){
    const now=new Date(Date.parse('2026-08-28T12:00:00Z')+i*3_600_000);
    result=submitLearningItem(db,{id:first.id,kind:'contrast',answer:'resposta errada',rating:1},now);
  }
  assert.equal(result.quality.status,'wrong');
  assert.ok(result.explanation.length>20);
  assert.ok(result.guidance.recommendation.length>10);
  const progress=progressDashboard(db,new Date('2026-08-29T12:00:00Z'),30);
  const focus=progress.attention.find(x=>x.skillType==='contrast'&&x.skillKey===first.skill);
  assert.ok(focus);
  assert.ok(focus.attentionScore>=45);
  assert.ok(focus.reasons.length>=1);
});

test('wrong grammar answers include an explanation and a concrete improvement action',()=>{
  const db=openDatabase(':memory:');
  const item=randomGrammar(db,'ser-estar');
  const result=submitGrammar(db,{id:item.id,answer:'forma errada'},new Date('2026-08-28T12:00:00Z'));
  assert.equal(result.quality.status,'wrong');
  assert.ok(result.explanation.length>10);
  assert.ok(result.guidance.explanation.length>10);
  assert.ok(result.guidance.recommendation.length>10);
});

test('dashboard identifies review debt and progress dashboard exposes evolution metrics',()=>{
  const db=openDatabase(':memory:');
  db.prepare("UPDATE srs SET reps=1,last_review_at='2026-08-01T12:00:00Z' WHERE item_type='vocabulary' AND item_id IN (SELECT id FROM vocabulary LIMIT 31)").run();
  const now=new Date('2026-08-28T12:00:00Z');
  const d=dashboard(db,now);
  assert.equal(d.reviewPressure.freezeNew,true);
  const p=progressDashboard(db,now,30);
  assert.equal(p.days,30);
  assert.ok(p.summary.due>=31);
  assert.ok('averageRetrievability' in p.summary);
  assert.ok(Array.isArray(p.activity));
  assert.ok(Array.isArray(p.attention));
});
