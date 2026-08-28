import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { buildTodayPlan, estimatedStudyMinutes, plannerOverview, plannerProgress, studyGoals, updateStudyGoals } from '../src/planner.mjs';
import { effectiveXpReport } from '../src/xp-economy.mjs';
import { createAssignment } from '../src/assignments.mjs';
import { createSidesServer } from '../src/server.mjs';

const NOW=new Date('2026-08-28T18:00:00-03:00');

test('V9 adds planner goals without losing previous subsystem schemas',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V9');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='plannerSchemaVersion'").get().value,'SIDES-PLANNER-V1');
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='study_goals'").get());
  for(const key of ['assignmentSchemaVersion','speechSchemaVersion','writingSchemaVersion','immersionSchemaVersion'])assert.ok(db.prepare('SELECT value FROM meta WHERE key=?').get(key));
});

test('study goals have practical defaults and validated limits',()=>{
  const db=openDatabase(':memory:');
  assert.deepEqual({...studyGoals(db),updatedAt:undefined},{dailyMinutes:20,weeklyMinutes:120,weeklyDays:5,preferredSessionMinutes:20,updatedAt:undefined});
  const changed=updateStudyGoals(db,{dailyMinutes:5,weeklyMinutes:9999,weeklyDays:9,preferredSessionMinutes:45},NOW);
  assert.equal(changed.dailyMinutes,10);
  assert.equal(changed.weeklyMinutes,840);
  assert.equal(changed.weeklyDays,7);
  assert.equal(changed.preferredSessionMinutes,45);
});

test('planner gives overdue FSRS debt maximum priority',()=>{
  const db=openDatabase(':memory:');
  db.prepare("UPDATE srs SET reps=3,due_at='2026-08-01T00:00:00.000Z' WHERE item_type='vocabulary' AND item_id IN (SELECT id FROM vocabulary LIMIT 12)").run();
  const plan=buildTodayPlan(db,NOW);
  assert.ok(plan.overdue7>=12);
  assert.equal(plan.items[0].id,'core:reviews');
  assert.equal(plan.items[0].priority,100);
});

test('near assignment becomes a top daily priority',()=>{
  const db=openDatabase(':memory:');
  db.prepare("UPDATE srs SET due_at='2099-01-01T00:00:00.000Z'").run();
  const a=createAssignment(db,{type:'talk',title:'Discurso próximo',dueDate:'2026-08-29',targetSeconds:600},NOW);
  const plan=buildTodayPlan(db,NOW);
  const item=plan.items.find(x=>x.assignmentId===a.id);
  assert.ok(item);
  assert.equal(item.priority,100);
  assert.match(item.reason,/Faltam 1 dia/);
});

test('planner restores weekly coverage for missing skills',()=>{
  const db=openDatabase(':memory:');
  db.prepare("UPDATE srs SET due_at='2099-01-01T00:00:00.000Z'").run();
  const plan=buildTodayPlan(db,NOW);
  const types=new Set(plan.items.map(x=>x.type));
  assert.ok(types.has('immersion'));
  assert.ok([...types].some(x=>['listening','reading','speaking','writing'].includes(x)));
});

test('study-time estimate combines core reviews and dedicated modules without storing content',()=>{
  const db=openDatabase(':memory:');
  const start=new Date('2026-08-28T00:00:00-03:00'),end=new Date('2026-08-29T00:00:00-03:00');
  db.prepare("INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES ('vocabulary',1,'vocabulary',3,1,180000,10,?)").run(NOW.toISOString());
  db.prepare("INSERT INTO speech_attempts(context_type,duration_ms,created_at) VALUES ('free',120000,?)").run(NOW.toISOString());
  db.prepare("INSERT INTO writing_attempts(prompt_id,context_type,word_count,char_count,issue_count,review_index,engine,response_ms,created_at) VALUES ('','free',10,40,0,90,'sides-fallback',60000,?)").run(NOW.toISOString());
  assert.equal(estimatedStudyMinutes(db,start,end),6);
});

test('effective XP sharply reduces repeated-item farming',()=>{
  const db=openDatabase(':memory:');
  const times=['2026-08-28T12:00:00Z','2026-08-28T12:20:00Z','2026-08-28T13:30:00Z','2026-08-28T20:00:00Z'];
  for(const at of times)db.prepare("INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES ('vocabulary',999,'vocabulary',4,1,1000,20,?)").run(at);
  const r=effectiveXpReport(db,NOW);
  assert.equal(r.rawXp,80);
  assert.ok(r.creditedXp<55,`credited=${r.creditedXp}`);
  assert.ok(r.discountedXp>20);
  assert.equal(r.policy,'SIDES-XP-V2');
});

test('effective XP daily cap prevents infinite reward while study remains possible',()=>{
  const db=openDatabase(':memory:');
  for(let i=0;i<80;i++)db.prepare("INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES ('grammar',?,'grammar',4,1,1000,20,?)").run(i,`2026-08-28T${String(10+Math.floor(i/20)).padStart(2,'0')}:${String((i%20)*3).padStart(2,'0')}:00Z`);
  const r=effectiveXpReport(db,NOW,{dailyCap:500});
  assert.ok(r.creditedXp<=500);
  assert.ok(r.cappedXp>0);
  assert.equal(r.today.remaining,0);
});

test('planner progress tracks weekly minutes, days and competence balance',()=>{
  const db=openDatabase(':memory:');
  db.prepare("INSERT INTO reviews(item_type,item_id,mode,rating,correct,response_ms,xp,reviewed_at) VALUES ('reading',1,'reading',3,1,600000,10,?)").run(NOW.toISOString());
  db.prepare("INSERT OR IGNORE INTO activity(day) VALUES ('2026-08-28')").run();
  db.prepare("UPDATE activity SET attempts=2,reading=1,listening=1 WHERE day='2026-08-28'").run();
  const p=plannerProgress(db,NOW);
  assert.ok(p.today.minutes>=10);
  assert.ok(p.week.days>=1);
  assert.equal(p.modes.reading,1);
  assert.equal(p.modes.listening,1);
});

test('HTTP planner API updates goals and export contains configuration, not generated plan snapshots',async()=>{
  const db=openDatabase(':memory:');
  const server=createSidesServer({db,now:()=>NOW});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try{
    const {port}=server.address(),base=`http://127.0.0.1:${port}`;
    const health=await fetch(`${base}/api/health`).then(r=>r.json());assert.equal(health.schema,'SIDES-API-V8');
    const planner=await fetch(`${base}/api/planner/today`).then(r=>r.json());assert.equal(planner.schema,'SIDES-PLANNER-V1');assert.ok(planner.plan.items.length>0);
    const goals=await fetch(`${base}/api/planner/goals`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dailyMinutes:30,weeklyMinutes:160,weeklyDays:6,preferredSessionMinutes:25})}).then(r=>r.json());assert.equal(goals.dailyMinutes,30);
    const rewards=await fetch(`${base}/api/rewards`).then(r=>r.json());assert.equal(rewards.policy,'SIDES-XP-V2');
    const backup=await fetch(`${base}/api/export`).then(r=>r.json());assert.equal(backup.schemaVersion,'SIDES-EXPORT-V8');assert.equal(backup.tables.study_goals.length,1);assert.equal('daily_plan' in backup.tables,false);
  } finally {await new Promise(resolve=>server.close(resolve));}
});

test('planner overview exposes mature goals, rewards and badges in one response',()=>{
  const db=openDatabase(':memory:');
  const o=plannerOverview(db,NOW);
  assert.equal(o.schema,'SIDES-PLANNER-V1');
  assert.ok(o.progress.goals.dailyMinutes>=10);
  assert.equal(o.rewards.policy,'SIDES-XP-V2');
  assert.ok(o.badges.some(x=>x.id==='review-control'));
  assert.ok(o.plan.estimatedMinutes>=10);
});
