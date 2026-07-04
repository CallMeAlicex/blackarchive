'use strict';

const path = require('path');
const fs   = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'archive.db');

// ── Load sql.js (pure JS, no native build needed) ──────────
const initSqlJs = require('sql.js');

let db;
let saveTimer = null;

// Persist DB to disk (debounced — max once per 2s)
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }, 2000);
}

// ── Schema ──────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS scribes (
    id          TEXT PRIMARY KEY,
    codename    TEXT UNIQUE NOT NULL,
    passphrase  TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS works (
    id          TEXT PRIMARY KEY,
    scribe_id   TEXT NOT NULL REFERENCES scribes(id),
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    author      TEXT,
    subtitle    TEXT,
    meta        TEXT NOT NULL DEFAULT '{}',
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS entries (
    id          TEXT PRIMARY KEY,
    work_id     TEXT NOT NULL REFERENCES works(id),
    position    INTEGER NOT NULL DEFAULT 0,
    title       TEXT,
    date_line   TEXT,
    body        TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_works_scribe ON works(scribe_id);
  CREATE INDEX IF NOT EXISTS idx_entries_work ON entries(work_id, position);
`;

// ── Helper: run a statement ─────────────────────────────────
function run(sql, params) {
  const stmt = db.prepare(sql);
  stmt.run(params || []);
  stmt.free();
  persist();
}

function get(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params || []);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function all(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params || []);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// ── Public API (mirrors better-sqlite3 interface used in server.js) ──
const scribes = {
  create: { run: (p) => { run(`INSERT INTO scribes (id,codename,passphrase) VALUES (?,?,?)`, [p.id, p.codename, p.passphrase]); } },
  findByCodename: { get: (codename) => get(`SELECT * FROM scribes WHERE lower(codename)=lower(?)`, [codename]) },
  findById:       { get: (id)       => get(`SELECT * FROM scribes WHERE id=?`, [id]) },
};

const works = {
  create: { run: (p) => { run(`INSERT INTO works (id,scribe_id,type,title,author,subtitle,meta) VALUES (?,?,?,?,?,?,?)`,
    [p.id, p.scribe_id, p.type, p.title, p.author||'', p.subtitle||'', p.meta||'{}']); } },

  update: { run: (p) => { run(`UPDATE works SET title=?,author=?,subtitle=?,meta=?,updated_at=strftime('%s','now') WHERE id=? AND scribe_id=?`,
    [p.title, p.author||'', p.subtitle||'', p.meta||'{}', p.id, p.scribe_id]); } },

  delete: { run: (id, scribe_id) => { run(`DELETE FROM works WHERE id=? AND scribe_id=?`, [id, scribe_id]); } },

  findById: { get: (id) => get(`SELECT * FROM works WHERE id=?`, [id]) },

  allPublic: { all: () => all(`
    SELECT w.*, s.codename as scribe_name,
           (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count
    FROM works w JOIN scribes s ON s.id=w.scribe_id
    ORDER BY w.created_at DESC
  `) },

  byScribe: { all: (scribe_id) => all(`
    SELECT w.*, (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count
    FROM works w WHERE w.scribe_id=? ORDER BY w.created_at DESC
  `, [scribe_id]) },
};

const entries = {
  insert:       { run: (p) => { run(`INSERT INTO entries (id,work_id,position,title,date_line,body) VALUES (?,?,?,?,?,?)`,
    [p.id, p.work_id, p.position, p.title||'', p.date_line||'', p.body||'']); } },
  deleteByWork: { run: (work_id) => { run(`DELETE FROM entries WHERE work_id=?`, [work_id]); } },
  forWork:      { all: (work_id) => all(`SELECT * FROM entries WHERE work_id=? ORDER BY position ASC`, [work_id]) },
};

function saveEntriesForWork(workId, entryList) {
  run(`DELETE FROM entries WHERE work_id=?`, [workId]);
  entryList.forEach((e, i) => {
    run(`INSERT INTO entries (id,work_id,position,title,date_line,body) VALUES (?,?,?,?,?,?)`,
      [e.id, workId, i, e.title||'', e.date_line||'', e.body||'']);
  });
}

// ── Init: load or create DB, run schema ─────────────────────
async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  persist(); // save schema immediately
  return db;
}

module.exports = { initDb, db: () => db, scribes, works, entries, saveEntriesForWork };
