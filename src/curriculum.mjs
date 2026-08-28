import {
  CURRICULUM_PACK,
  block5Vocabulary,
  block5LearningItems,
  block5Grammar,
  block5Listening,
  block5Reading,
  curriculumTargets,
  curriculumFramework
} from './block5-content.mjs';

const EPOCH = new Date(0).toISOString();

function upsertMeta(db, row) {
  db.prepare(`INSERT INTO curriculum_meta(content_key,item_type,item_id,level,topic,difficulty,prerequisites_json,pack)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(content_key) DO UPDATE SET
      item_type=excluded.item_type,item_id=excluded.item_id,level=excluded.level,topic=excluded.topic,
      difficulty=excluded.difficulty,prerequisites_json=excluded.prerequisites_json,pack=excluded.pack`)
    .run(row.code,row.itemType,row.itemId,row.level,row.topic,Number(row.difficulty||1),JSON.stringify(row.prerequisites||[]),CURRICULUM_PACK);
}

function ensureSrs(db,itemType,itemId) {
  db.prepare('INSERT OR IGNORE INTO srs(item_type,item_id,due_at) VALUES (?,?,?)').run(itemType,itemId,EPOCH);
}

function seedVocabulary(db) {
  const find=db.prepare('SELECT id FROM vocabulary WHERE spanish=? AND portuguese=? ORDER BY id LIMIT 1');
  const insert=db.prepare('INSERT INTO vocabulary(spanish,portuguese,example_es,example_pt,level,tags) VALUES (?,?,?,?,?,?)');
  for(const x of block5Vocabulary){
    let row=find.get(x.spanish,x.portuguese);
    if(!row) row={id:Number(insert.run(x.spanish,x.portuguese,x.example_es,x.example_pt,x.level,x.tags).lastInsertRowid)};
    ensureSrs(db,'vocabulary',row.id);
    upsertMeta(db,{...x,itemType:'vocabulary',itemId:row.id});
  }
}

function seedLearning(db) {
  const find=db.prepare('SELECT id FROM learning_items WHERE kind=? AND prompt=? AND answer=? ORDER BY id LIMIT 1');
  const insert=db.prepare(`INSERT INTO learning_items(kind,level,skill,prompt,answer,alternatives_json,explanation,example,tags)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  for(const x of block5LearningItems){
    let row=find.get(x.kind,x.prompt,x.answer);
    if(!row) row={id:Number(insert.run(x.kind,x.level,x.skill,x.prompt,x.answer,JSON.stringify(x.alternatives||[]),x.explanation,x.example,x.tags||'').lastInsertRowid)};
    ensureSrs(db,x.kind,row.id);
    upsertMeta(db,{...x,itemType:x.kind,itemId:row.id});
  }
}

function seedGrammar(db) {
  const find=db.prepare('SELECT id FROM grammar_exercises WHERE skill=? AND prompt=? ORDER BY id LIMIT 1');
  const insert=db.prepare('INSERT INTO grammar_exercises(level,skill,prompt,answers_json,explanation) VALUES (?,?,?,?,?)');
  for(const x of block5Grammar){
    let row=find.get(x.skill,x.prompt);
    if(!row) row={id:Number(insert.run(x.level,x.skill,x.prompt,JSON.stringify(x.answers),x.explanation).lastInsertRowid)};
    upsertMeta(db,{...x,itemType:'grammar',itemId:row.id});
  }
}

function seedListening(db) {
  const find=db.prepare('SELECT id FROM listening_items WHERE text=? ORDER BY id LIMIT 1');
  const insert=db.prepare('INSERT INTO listening_items(level,text,translation) VALUES (?,?,?)');
  for(const x of block5Listening){
    let row=find.get(x.text);
    if(!row) row={id:Number(insert.run(x.level,x.text,x.translation).lastInsertRowid)};
    upsertMeta(db,{...x,itemType:'listening',itemId:row.id});
  }
}

function seedReading(db) {
  const find=db.prepare('SELECT id FROM reading_texts WHERE title=? AND body=? ORDER BY id LIMIT 1');
  const insert=db.prepare('INSERT INTO reading_texts(level,title,body,questions_json) VALUES (?,?,?,?)');
  for(const x of block5Reading){
    let row=find.get(x.title,x.body);
    if(!row) row={id:Number(insert.run(x.level,x.title,x.body,JSON.stringify(x.questions)).lastInsertRowid)};
    upsertMeta(db,{...x,itemType:'reading',itemId:row.id});
  }
}

export function ensureCurriculum(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS curriculum_meta (
      content_key TEXT PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      level TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty REAL NOT NULL DEFAULT 1,
      prerequisites_json TEXT NOT NULL DEFAULT '[]',
      pack TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_curriculum_lookup ON curriculum_meta(item_type,level,topic,item_id);
  `);
  const pack=db.prepare("SELECT value FROM meta WHERE key='curriculumPackVersion'").get()?.value;
  if(pack!==CURRICULUM_PACK){
    db.exec('BEGIN IMMEDIATE');
    try{
      seedVocabulary(db);
      seedLearning(db);
      seedGrammar(db);
      seedListening(db);
      seedReading(db);
      db.prepare("INSERT INTO meta(key,value) VALUES ('curriculumPackVersion',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(CURRICULUM_PACK);
      db.prepare("INSERT INTO meta(key,value) VALUES ('curriculumSchemaVersion','SIDES-CURRICULUM-SCHEMA-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-CURRICULUM-SCHEMA-V1'").run();
      db.exec('COMMIT');
    }catch(error){
      db.exec('ROLLBACK');
      throw error;
    }
  }else{
    db.prepare("INSERT INTO meta(key,value) VALUES ('curriculumSchemaVersion','SIDES-CURRICULUM-SCHEMA-V1') ON CONFLICT(key) DO UPDATE SET value='SIDES-CURRICULUM-SCHEMA-V1'").run();
  }
  return curriculumOverview(db);
}

function tableCount(db,table) {
  return Number(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n);
}

export function curriculumOverview(db) {
  const totals={
    vocabulary:tableCount(db,'vocabulary'),
    learning:tableCount(db,'learning_items'),
    grammar:tableCount(db,'grammar_exercises'),
    listening:tableCount(db,'listening_items'),
    reading:tableCount(db,'reading_texts')
  };
  const byLevel={};
  for(const level of ['A1','A2','B1','B2']){
    byLevel[level]={
      vocabulary:Number(db.prepare('SELECT COUNT(*) n FROM vocabulary WHERE level=?').get(level).n),
      learning:Number(db.prepare('SELECT COUNT(*) n FROM learning_items WHERE level=?').get(level).n),
      grammar:Number(db.prepare('SELECT COUNT(*) n FROM grammar_exercises WHERE level=?').get(level).n),
      listening:Number(db.prepare('SELECT COUNT(*) n FROM listening_items WHERE level=?').get(level).n),
      reading:Number(db.prepare('SELECT COUNT(*) n FROM reading_texts WHERE level=?').get(level).n)
    };
  }
  const topics=db.prepare(`SELECT topic,level,COUNT(*) items
    FROM curriculum_meta WHERE pack=? GROUP BY topic,level ORDER BY level,items DESC,topic`).all(CURRICULUM_PACK);
  const targets={
    vocabulary:{target:curriculumTargets.vocabulary,value:totals.vocabulary,done:totals.vocabulary>=curriculumTargets.vocabulary},
    learning:{target:curriculumTargets.learning,value:totals.learning,done:totals.learning>=curriculumTargets.learning},
    grammar:{target:curriculumTargets.grammar,value:totals.grammar,done:totals.grammar>=curriculumTargets.grammar},
    listening:{target:curriculumTargets.listening,value:totals.listening,done:totals.listening>=curriculumTargets.listening},
    reading:{target:curriculumTargets.reading,value:totals.reading,done:totals.reading>=curriculumTargets.reading}
  };
  return {
    pack:CURRICULUM_PACK,
    framework:curriculumFramework,
    totals,byLevel,targets,topics,
    complete:Object.values(targets).every(x=>x.done)
  };
}

export function curriculumMeta(db,itemType,itemId) {
  const row=db.prepare('SELECT * FROM curriculum_meta WHERE item_type=? AND item_id=? ORDER BY content_key LIMIT 1').get(itemType,Number(itemId));
  if(!row)return null;
  return {...row,prerequisites:JSON.parse(row.prerequisites_json||'[]')};
}

export function prerequisiteReadiness(db,itemType,itemId) {
  const meta=curriculumMeta(db,itemType,itemId);
  if(!meta||!meta.prerequisites.length)return 1;
  const scores=meta.prerequisites.map(token=>{
    const split=String(token).indexOf(':');
    if(split<1)return 0.45;
    const type=token.slice(0,split),key=token.slice(split+1);
    const row=db.prepare('SELECT score,attempts FROM skill_mastery WHERE skill_type=? AND skill_key=?').get(type,key);
    if(!row)return 0.45;
    const confidence=Math.min(1,Number(row.attempts||0)/5);
    return Number(row.score||0.5)*confidence+0.45*(1-confidence);
  });
  return scores.reduce((a,b)=>a+b,0)/scores.length;
}

export function rankByReadiness(db,itemType,rows) {
  return [...rows].sort((a,b)=>{
    const ar=prerequisiteReadiness(db,itemType,a.id);
    const br=prerequisiteReadiness(db,itemType,b.id);
    return br-ar;
  });
}
