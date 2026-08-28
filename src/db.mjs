import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { vocabularySeed, grammarSeed, listeningSeed, readingSeed, placementSeed } from './content.mjs';

export function openDatabase(path = resolve('data/sides.sqlite')) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 3000 });
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  migrate(db);
  seed(db);
  return db;
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
  `);
}

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM vocabulary').get().n;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO vocabulary(spanish,portuguese,example_es,example_pt,level,tags) VALUES (?,?,?,?,?,?)');
    for (const row of vocabularySeed) insert.run(...row);
    const now = new Date(0).toISOString();
    const srs = db.prepare('INSERT INTO srs(item_type,item_id,due_at) VALUES (?,?,?)');
    for (const row of db.prepare('SELECT id FROM vocabulary').all()) srs.run('vocabulary', row.id, now);
  }

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

  const defaults = {
    schemaVersion: 'SIDES-DB-V2',
    placementLevel: 'UNASSESSED',
    placementCompleted: 'false',
    spanishVariant: 'es',
    createdAt: new Date().toISOString()
  };
  const meta = db.prepare('INSERT OR IGNORE INTO meta(key,value) VALUES (?,?)');
  for (const [k,v] of Object.entries(defaults)) meta.run(k,v);
  db.prepare('INSERT INTO meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('schemaVersion','SIDES-DB-V2');
}

export function getMeta(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM meta WHERE key=?').get(key);
  return row ? row.value : fallback;
}

export function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, String(value));
}
