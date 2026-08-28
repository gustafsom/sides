import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.mjs';
import { assignmentOverview, createAssignment, getAssignment, listAssignments, recordAssignmentPractice, updateAssignment } from '../src/assignments.mjs';
import { createSidesServer } from '../src/server.mjs';

const NOW=new Date('2026-08-28T12:00:00Z');

test('V10 preserves versioned assignment tables without audio persistence columns',()=>{
  const db=openDatabase(':memory:');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schemaVersion'").get().value,'SIDES-DB-V10');
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='assignmentSchemaVersion'").get().value,'SIDES-JW-ASSIGNMENTS-V1');
  const assignmentCols=db.prepare('PRAGMA table_info(jw_assignments)').all().map(x=>x.name);
  const practiceCols=db.prepare('PRAGMA table_info(jw_assignment_practices)').all().map(x=>x.name);
  assert.ok(assignmentCols.includes('reference_text'));
  assert.ok(practiceCols.includes('ratings_json'));
  assert.equal([...assignmentCols,...practiceCols].some(x=>/audio|blob|recording/i.test(x)),false);
});

test('assignment planner creates spaced phases through the real due date',()=>{
  const db=openDatabase(':memory:');
  const item=createAssignment(db,{type:'reading',title:'Leitura',reference:'Jeremías 30:18-24',dueDate:'2026-09-20',dueTime:'19:00',targetSeconds:240},NOW);
  assert.equal(item.type,'reading');assert.equal(item.readiness,0);assert.equal(item.plan.phase,'foundation');assert.equal(item.plan.daysRemaining,23);
  assert.ok(item.plan.schedule.length>=10);assert.equal(item.plan.schedule[0].date,'2026-08-28');assert.equal(item.plan.schedule.at(-1).date,'2026-09-20');
  assert.ok(item.plan.schedule.some(x=>x.phase==='build'));assert.ok(item.plan.schedule.some(x=>x.phase==='rehearsal'));assert.ok(item.plan.schedule.some(x=>x.phase==='final'));
});

test('rehearsal raises readiness and weakest rubric becomes explicit focus',()=>{
  const db=openDatabase(':memory:');
  const item=createAssignment(db,{type:'talk',title:'Discurso',dueDate:'2026-09-04',targetSeconds:600},NOW);
  const after=recordAssignmentPractice(db,item.id,{phase:'rehearsal',durationMs:580000,confidence:4,ratings:{naturalidad:2,ritmo:4,conviccion:4,conclusion:3},notes:'Trabalhar naturalidade.'},NOW);
  assert.ok(after.readiness>0);assert.equal(after.practiceCount,1);assert.equal(after.status,'practicing');assert.equal(after.plan.focusRubrics[0].key,'naturalidad');assert.equal(after.plan.focusRubrics[0].average,2);assert.ok(after.xp>=8);
  assert.ok(db.prepare("SELECT * FROM skill_mastery WHERE skill_type='jw' AND skill_key='rubric:naturalidad'").get());
});

test('multiple good rehearsals can mark an assignment ready and history remains intact',()=>{
  const db=openDatabase(':memory:');const item=createAssignment(db,{type:'comment',title:'Comentário',dueDate:'2026-09-02',targetSeconds:45},NOW);let current=item;
  for(let i=0;i<5;i++)current=recordAssignmentPractice(db,item.id,{durationMs:44000,confidence:5,ratings:{naturalidad:5,ritmo:4,sencillez:5,conviccion:4}},new Date(NOW.getTime()+i*86400000));
  assert.ok(current.readiness>=75);assert.equal(current.status,'ready');assert.equal(current.practiceCount,5);
  const completed=updateAssignment(db,item.id,{status:'completed'},new Date('2026-09-02T12:00:00Z'));assert.equal(completed.status,'completed');assert.equal(completed.practiceCount,5);
});

test('cancel is non-destructive and removes item from active/list view only',()=>{
  const db=openDatabase(':memory:');const item=createAssignment(db,{type:'student',title:'Designação',dueDate:'2026-09-10'},NOW);
  recordAssignmentPractice(db,item.id,{durationMs:120000,confidence:3,ratings:{naturalidad:3}},NOW);updateAssignment(db,item.id,{status:'cancelled'},NOW);
  assert.equal(listAssignments(db,NOW).some(x=>x.id===item.id),false);const preserved=getAssignment(db,item.id,NOW);assert.equal(preserved.status,'cancelled');assert.equal(preserved.practiceCount,1);
});

test('assignment input validation rejects malformed dates, times and types',()=>{
  const db=openDatabase(':memory:');
  assert.throws(()=>createAssignment(db,{title:'X',type:'invalid',dueDate:'2026-09-01'},NOW),/ASSIGNMENT_TYPE_INVALID/);assert.throws(()=>createAssignment(db,{title:'X',dueDate:'2026-02-31'},NOW),/ASSIGNMENT_DATE_INVALID/);assert.throws(()=>createAssignment(db,{title:'X',dueDate:'2026-09-01',dueTime:'25:10'},NOW),/ASSIGNMENT_TIME_INVALID/);assert.throws(()=>createAssignment(db,{title:'',dueDate:'2026-09-01'},NOW),/ASSIGNMENT_TITLE_REQUIRED/);
});

test('overview prioritizes nearest future assignment and reports readiness totals',()=>{
  const db=openDatabase(':memory:');createAssignment(db,{type:'talk',title:'Mais tarde',dueDate:'2026-09-20'},NOW);const soon=createAssignment(db,{type:'reading',title:'Primeiro',dueDate:'2026-08-30'},NOW);const overview=assignmentOverview(db,NOW);
  assert.equal(overview.active,2);assert.equal(overview.next.id,soon.id);assert.equal(overview.ready,0);assert.equal(overview.overdue,0);
});

test('HTTP assignment API creates data and backup includes assignment history',async()=>{
  const db=openDatabase(':memory:');const server=createSidesServer({db,now:()=>NOW});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try{
    const {port}=server.address(),base=`http://127.0.0.1:${port}`;const health=await fetch(`${base}/api/health`).then(r=>r.json());assert.equal(health.schema,'SIDES-API-V9');
    const created=await fetch(`${base}/api/jw/assignments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'reading',title:'API',dueDate:'2026-09-01',targetSeconds:180})}).then(r=>r.json());assert.ok(created.id>0);
    await fetch(`${base}/api/jw/assignments/${created.id}/practice`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({durationMs:170000,confidence:4,ratings:{naturalidad:3}})});
    const backup=await fetch(`${base}/api/export`).then(r=>r.json());assert.equal(backup.schemaVersion,'SIDES-EXPORT-V9');assert.equal(backup.tables.jw_assignments.length,1);assert.equal(backup.tables.jw_assignment_practices.length,1);assert.equal('audio' in backup.tables.jw_assignment_practices[0],false);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
