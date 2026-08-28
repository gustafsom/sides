import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, setMeta } from '../src/db.mjs';
import { curriculumStatus, dailySession, getVocabularyCard, nextLearningItem, randomGrammar, randomListening, randomReading } from '../src/service.mjs';
import { CURRICULUM_PACK, block5Counts } from '../src/block5-content.mjs';
import { ensureCurriculum, prerequisiteReadiness } from '../src/curriculum.mjs';

test('Bloco 5 seeds the full A1-B2 curriculum and reaches all minimum targets',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V4');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='curriculumPackVersion'").get().value,CURRICULUM_PACK);
  const status=curriculumStatus(db);
  assert.equal(status.complete,true);
  assert.ok(status.totals.vocabulary>=600);
  assert.ok(status.totals.learning>=300);
  assert.ok(status.totals.grammar>=150);
  assert.ok(status.totals.listening>=100);
  assert.ok(status.totals.reading>=50);
  assert.equal(block5Counts.vocabulary,640);
  assert.equal(block5Counts.learning,320);
  assert.equal(block5Counts.grammar,160);
  assert.equal(block5Counts.listening,100);
  assert.equal(block5Counts.reading,52);
});

test('curriculum metadata covers every CEFR level and content family',()=>{
  const db=openDatabase(':memory:');
  for(const level of ['A1','A2','B1','B2']){
    for(const type of ['vocabulary','chunk','grammar','listening','reading']){
      const n=Number(db.prepare('SELECT COUNT(*) n FROM curriculum_meta WHERE pack=? AND level=? AND item_type=?').get(CURRICULUM_PACK,level,type).n);
      const minimum={vocabulary:150,chunk:75,grammar:40,listening:25,reading:13}[type];
      assert.ok(n>=minimum,`${level}/${type} has ${n}, expected >= ${minimum}`);
    }
  }
  const bad=Number(db.prepare(`SELECT COUNT(*) n FROM curriculum_meta
    WHERE pack=? AND (topic='' OR difficulty<1 OR difficulty>4 OR prerequisites_json IS NULL)`).get(CURRICULUM_PACK).n);
  assert.equal(bad,0);
});

test('curriculum seeding is idempotent',()=>{
  const db=openDatabase(':memory:');
  const before={
    vocab:Number(db.prepare('SELECT COUNT(*) n FROM vocabulary').get().n),
    learning:Number(db.prepare('SELECT COUNT(*) n FROM learning_items').get().n),
    grammar:Number(db.prepare('SELECT COUNT(*) n FROM grammar_exercises').get().n),
    listening:Number(db.prepare('SELECT COUNT(*) n FROM listening_items').get().n),
    reading:Number(db.prepare('SELECT COUNT(*) n FROM reading_texts').get().n),
    meta:Number(db.prepare('SELECT COUNT(*) n FROM curriculum_meta').get().n)
  };
  ensureCurriculum(db);
  const after={
    vocab:Number(db.prepare('SELECT COUNT(*) n FROM vocabulary').get().n),
    learning:Number(db.prepare('SELECT COUNT(*) n FROM learning_items').get().n),
    grammar:Number(db.prepare('SELECT COUNT(*) n FROM grammar_exercises').get().n),
    listening:Number(db.prepare('SELECT COUNT(*) n FROM listening_items').get().n),
    reading:Number(db.prepare('SELECT COUNT(*) n FROM reading_texts').get().n),
    meta:Number(db.prepare('SELECT COUNT(*) n FROM curriculum_meta').get().n)
  };
  assert.deepEqual(after,before);
});

test('prerequisite readiness is a soft ranking signal that grows with demonstrated mastery',()=>{
  const db=openDatabase(':memory:');
  const meta=db.prepare(`SELECT * FROM curriculum_meta
    WHERE pack=? AND item_type='grammar' AND level='B2' AND prerequisites_json<>'[]' LIMIT 1`).get(CURRICULUM_PACK);
  assert.ok(meta);
  const initial=prerequisiteReadiness(db,'grammar',meta.item_id);
  assert.ok(initial>=0.4&&initial<=0.5);
  const [token]=JSON.parse(meta.prerequisites_json);
  const cut=token.indexOf(':');
  const type=token.slice(0,cut),key=token.slice(cut+1);
  db.prepare(`INSERT INTO skill_mastery(skill_type,skill_key,attempts,correct,score,last_seen_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(skill_type,skill_key) DO UPDATE SET attempts=excluded.attempts,correct=excluded.correct,score=excluded.score,last_seen_at=excluded.last_seen_at`)
    .run(type,key,8,7,0.9,new Date('2026-08-28T12:00:00Z').toISOString());
  const ready=prerequisiteReadiness(db,'grammar',meta.item_id);
  assert.ok(ready>initial);
  assert.ok(ready>=0.85);
});

test('unassessed learner remains inside A1 across the expanded curriculum',()=>{
  const db=openDatabase(':memory:');
  setMeta(db,'placementLevel','UNASSESSED');
  assert.equal(getVocabularyCard(db,new Date('2026-08-28T12:00:00Z')).level,'A1');
  assert.equal(nextLearningItem(db,'chunk',new Date('2026-08-28T12:00:00Z')).level,'A1');
  assert.equal(randomGrammar(db).level,'A1');
  assert.equal(randomListening(db).level,'A1');
  assert.equal(randomReading(db).level,'A1');
  const session=dailySession(db,30);
  assert.ok(session.length>0);
  assert.ok(session.every(x=>x.level==='A1'));
});

test('curriculum dashboard exposes balanced coverage by level',()=>{
  const db=openDatabase(':memory:');
  const status=curriculumStatus(db);
  for(const level of ['A1','A2','B1','B2']){
    assert.ok(status.byLevel[level].vocabulary>=140);
    assert.ok(status.byLevel[level].learning>=75);
    assert.ok(status.byLevel[level].grammar>=40);
    assert.ok(status.byLevel[level].listening>=25);
    assert.ok(status.byLevel[level].reading>=13);
    assert.ok(status.framework[level].goal.length>20);
  }
  assert.ok(status.topics.length>=16);
});