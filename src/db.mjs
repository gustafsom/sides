import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { vocabularySeed, grammarSeed, listeningSeed, readingSeed, placementSeed } from './content.mjs';
import { learningItemSeed } from './block4-content.mjs';
import { ensureCurriculum } from './curriculum.mjs';
import { ensureAssignmentsSchema } from './assignments.mjs';

export function openDatabase(path = resolve('data/sides.sqlite')) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 3000 });
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  migrate(db);
  seed(db);
  ensureCurriculum(db);
  ensureAssignmentsSchema(db);
  setMeta(db,'schemaVersion','SIDES-DB-V5');
  return db;
}

function hasColumn(db,table,column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(x=>x.name===column);
}

function addColumn(db,table,column,definition) {
  if(!hasColumn(db,table,column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY,
      spanish TEXT NOT NULL,
      portuguese TEXT NOT NULL,
      example_es TEXT,
      example_pt TEXT,
      level TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT ''
    ) STRICT;

    CREATE TABLE IF NOT EXISTS srs (
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      due_at TEXT NOT NULL,
      interval_days REAL NOT NULL DEFAULT 0,
      ease REAL NOT NULL DEFAULT 2.35,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      last_review_at TEXT,
      scheduler TEXT NOT NULL DEFAULT 'SIDES-SRS-V1',
      PRIMARY KEY (item_type, item_id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      rating INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      response_ms INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      reviewed_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS grammar_exercises (
      id INTEGER PRIMARY KEY,
      level TEXT NOT NULL,
      skill TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      explanation TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS listening_items (
      id INTEGER PRIMARY KEY,
      level TEXT NOT NULL,
      text TEXT NOT NULL,
      translation TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS reading_texts (
      id INTEGER PRIMARY KEY,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      questions_json TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS placement_items (
      id INTEGER PRIMARY KEY,
      level TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      options_json TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS learning_items (
      id INTEGER PRIMARY KEY,
      kind TEXT NOT NULL CHECK(kind IN ('chunk','contrast')),
      level TEXT NOT NULL,
      skill TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      alternatives_json TEXT NOT NULL DEFAULT '[]',
      explanation TEXT NOT NULL,
      example TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT ''
    ) STRICT;

    CREATE TABLE IF NOT EXISTS activity (
      day TEXT PRIMARY KEY,
      xp INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      vocabulary INTEGER NOT NULL DEFAULT 0,
      grammar INTEGER NOT NULL DEFAULT 0,
      listening INTEGER NOT NULL DEFAULT 0,
      reading INTEGER NOT NULL DEFAULT 0,
      speaking INTEGER NOT NULL DEFAULT 0,
      minutes INTEGER NOT NULL DEFAULT 0
    ) STRICT;

    CREATE TABLE IF NOT EXISTS skill_mastery (
      skill_type TEXT NOT NULL,
      skill_key TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      score REAL NOT NULL DEFAULT 0.5,
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (skill_type, skill_key)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS skill_events (
      id INTEGER PRIMARY KEY,
      skill_type TEXT NOT NULL,
      skill_key TEXT NOT NULL,
      correct INTEGER NOT NULL,
      score_after REAL NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS error_log (
      id INTEGER PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      skill_key TEXT NOT NULL,
      error_kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_error_log_open ON error_log(resolved_at, created_at);
    CREATE INDEX IF NOT EXISTS idx_skill_events_lookup ON skill_events(skill_type,skill_key,created_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_time ON reviews(reviewed_at,mode);
    CREATE INDEX IF NOT EXISTS idx_srs_due ON srs(due_at,item_type,reps);
  `);

  addColumn(db,'srs','stability','REAL');
  addColumn(db,'srs','difficulty','REAL');
  addColumn(db,'srs','elapsed_days','INTEGER NOT NULL DEFAULT 0');
  addColumn(db,'srs','scheduled_days','INTEGER NOT NULL DEFAULT 0');
  addColumn(db,'srs','learning_steps','INTEGER NOT NULL DEFAULT 0');
  addColumn(db,'srs','state','INTEGER NOT NULL DEFAULT 0');
}

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM vocabulary').get().n;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO vocabulary(spanish,portuguese,example_es,example_pt,level,tags) VALUES (?,?,?,?,?,?)');
    for (const row of vocabularySeed) insert.run(...row);
  }

  const epoch = new Date(0).toISOString();
  const ensureSrs = db.prepare('INSERT OR IGNORE INTO srs(item_type,item_id,due_at) VALUES (?,?,?)');
  for (const row of db.prepare('SELECT id FROM vocabulary').all()) ensureSrs.run('vocabulary', row.id, epoch);

  if (db.prepare('SELECT COUNT(*) AS n FROM grammar_exercises').get().n === 0) {
    const insert = db.prepare('INSERT INTO grammar_exercises(level,skill,prompt,answers_json,explanation) VALUES (?,?,?,?,?)');
    for (const x of grammarSeed) insert.run(x.level, x.skill, x.prompt, JSON.stringify(x.answers), x.explanation);
  }

  if (db.prepare('SELECT COUNT(*) AS n FROM listening_items').get().n === 0) {
    const insert = db.prepare('INSERT INTO listening_items(level,text,translation) VALUES (?,?,?)');
    for (const x of listeningSeed) insert.run(x.level, x.text, x.translation);
  }

  if (db.prepare('SELECT COUNT(*) AS n FROM reading_texts').get().n === 0) {
    const insert = db.prepare('INSERT INTO reading_texts(level,title,body,questions_json) VALUES (?,?,?,?)');
    for (const x of readingSeed) insert.run(x.level, x.title, x.body, JSON.stringify(x.questions));
  }

  if (db.prepare('SELECT COUNT(*) AS n FROM placement_items').get().n === 0) {
    const insert = db.prepare('INSERT INTO placement_items(level,prompt,answers_json,options_json) VALUES (?,?,?,?)');
    for (const x of placementSeed) insert.run(x.level, x.prompt, JSON.stringify(x.answers), JSON.stringify(x.options));
  }

  if (db.prepare('SELECT COUNT(*) AS n FROM learning_items').get().n === 0) {
    const insert = db.prepare(`INSERT INTO learning_items(kind,level,skill,prompt,answer,alternatives_json,explanation,example,tags)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    for (const x of learningItemSeed) insert.run(x.kind,x.level,x.skill,x.prompt,x.answer,JSON.stringify(x.alternatives||[]),x.explanation,x.example,x.tags||'');
  }
  for (const row of db.prepare('SELECT id,kind FROM learning_items').all()) ensureSrs.run(row.kind,row.id,epoch);

  const defaults = {
    schemaVersion: 'SIDES-DB-V5',
    placementLevel: 'UNASSESSED',
    placementCompleted: 'false',
    spanishVariant: 'es',
    createdAt: new Date().toISOString()
  };
  const meta = db.prepare('INSERT OR IGNORE INTO meta(key,value) VALUES (?,?)');
  for (const [k,v] of Object.entries(defaults)) meta.run(k,v);
}

export function getMeta(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM meta WHERE key=?').get(key);
  return row ? row.value : fallback;
}

export function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, String(value));
}
