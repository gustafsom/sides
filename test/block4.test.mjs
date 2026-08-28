import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../src/db.mjs';
import { dashboard, getVocabularyCard, nextLearningItem, progressDashboard, randomGrammar, submitGrammar, submitLearningItem, submitVocabulary } from '../src/service.mjs';
import { SCHEDULER_ID, scheduleFsrs } from '../src/fsrs-adapter.mjs';

test('V10 schema keeps FSRS, adaptive history, curriculum, assignments, speech, writing, immersion, planner and integrity',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');
  const columns=new Set(db.prepare('PRAGMA table_info(srs)').all().map(x=>x.name));
  for(const name of ['stability','difficulty','elapsed_days','scheduled_days','learning_steps','state']) assert.ok(columns.has(name));
  for(const table of ['skill_events','curriculum_meta','jw_assignments','jw_assignment_practices','speech_attempts','writing_attempts','writing_issue_summary','immersion_sessions','immersion_turn_metrics','study_goals','maintenance_state'])
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table));
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='plannerSchemaVersion'").get().value,'SIDES-PLANNER-V1');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='integritySchemaVersion'").get().value,'SIDES-INTEGRITY-V1');
});

test('real V2 database migration preserves study data and legacy review state through V10',()=>{
  const dir=mkdtempSync(join(tmpdir(),'sides-v2-'));
  const path=join(dir,'sides.sqlite');
  try{
    const old=new DatabaseSync(path);
    old.exec(`
      CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL) STRICT;
      CREATE TABLE vocabulary(id INTEGER PRIMARY KEY,spanish TEXT NOT NULL,portuguese TEXT NOT NULL,example_es TEXT,example_pt TEXT,level TEXT NOT NULL,tags TEXT NOT NULL DEFAULT '') STRICT;
      CREATE TABLE srs(item_type TEXT NOT NULL,item_id INTEGER NOT NULL,due_at TEXT NOT NULL,interval_days REAL NOT NULL DEFAULT 0,ease REAL NOT NULL DEFAULT 2.35,reps INTEGER NOT NULL DEFAULT 0,lapses INTEGER NOT NULL DEFAULT 0,last_review_at TEXT,scheduler TEXT NOT NULL DEFAULT 'SIDES-SRS-V1',PRIMARY KEY(item_type,item_id)) STRICT;
    `);
    old.prepare('INSERT INTO meta(key,value) VALUES (?,?)').run('schemaVersion','SIDES-DB-V2');
    old.prepare('INSERT INTO meta(key,value) VALUES (?,?)').run('placementLevel','B1');
    old.prepare('INSERT INTO vocabulary(id,spanish,portuguese,example_es,example_pt,level,tags) VALUES (?,?,?,?,?,?,?)')
      .run(77,'prueba preservada','teste preservado','Una prueba preservada.','Um teste preservado.','B1','migracao');
    old.prepare('INSERT INTO srs(item_type,item_id,due_at,interval_days,ease,reps,lapses,last_review_at,scheduler) VALUES (?,?,?,?,?,?,?,?,?)')
      .run('vocabulary',77,'2026-09-05T12:00:00.000Z',12.5,2.48,9,2,'2026-08-24T12:00:00.000Z','SIDES-SRS-V1');
    old.close();

    const db=openDatabase(path);
    const vocab=db.prepare('SELECT * FROM vocabulary WHERE id=77').get();
    const state=db.prepare("SELECT * FROM srs WHERE item_type='vocabulary' AND item_id=77").get();
    assert.equal(vocab.spanish,'prueba preservada');
    assert.equal(state.interval_days,12.5);
    assert.equal(state.reps,9);
    assert.equal(state.lapses,2);
    assert.equal(state.scheduler,'SIDES-SRS-V1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='placementLevel'").get().value,'B1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='assignmentSchemaVersion'").get().value,'SIDES-JW-ASSIGNMENTS-V1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='speechSchemaVersion'").get().value,'SIDES-SPEECH-V1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='writingSchemaVersion'").get().value,'SIDES-WRITING-V1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='immersionSchemaVersion'").get().value,'SIDES-IMMERSION-V1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='plannerSchemaVersion'").get().value,'SIDES-PLANNER-V1');
    assert.equal(db.prepare("SELECT value FROM meta WHERE key='integritySchemaVersion'").get().value,'SIDES-INTEGRITY-V1');
    const activityCols=new Set(db.prepare('PRAGMA table_info(activity)').all().map(x=>x.name));
    assert.ok(activityCols.has('writing'));assert.ok(activityCols.has('immersion'));
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='study_goals'").get());
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='maintenance_state'").get());
    db.close();
  } finally { rmSync(dir,{recursive:true,force:true}); }
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
});

test('wrong grammar answers include explanation and concrete improvement action',()=>{
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
