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
    is_admin    INTEGER NOT NULL DEFAULT 0,
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
    archived    INTEGER NOT NULL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS holdings (
    id          TEXT PRIMARY KEY,
    scribe_id   TEXT NOT NULL REFERENCES scribes(id),
    work_id     TEXT NOT NULL REFERENCES works(id),
    assigned_by TEXT,
    assigned_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    UNIQUE(scribe_id, work_id)
  );

  CREATE TABLE IF NOT EXISTS souls (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    race        TEXT,
    status      TEXT,
    known       TEXT NOT NULL DEFAULT '',
    created_by  TEXT,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  -- Cross-references: which souls a work (report/catchment) names.
  CREATE TABLE IF NOT EXISTS mentions (
    id        TEXT PRIMARY KEY,
    soul_id   TEXT NOT NULL,
    work_id   TEXT NOT NULL,
    UNIQUE(soul_id, work_id)
  );

  -- Unrecorded names a report named that aren't yet in the Index — leads.
  CREATE TABLE IF NOT EXISTS investigations (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    name_key    TEXT NOT NULL UNIQUE,
    work_id     TEXT,
    status      TEXT NOT NULL DEFAULT 'open',
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  -- The social boards: 'notice' (in-character) and 'antechamber' (out of character).
  -- A row with parent_id IS NULL is a thread; otherwise it is a reply to that thread.
  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    board       TEXT NOT NULL,
    scribe_id   TEXT NOT NULL,
    parent_id   TEXT,
    kind        TEXT,
    title       TEXT,
    body        TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_posts_board ON posts(board, created_at);
  CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id);
  CREATE INDEX IF NOT EXISTS idx_works_scribe ON works(scribe_id);
  CREATE INDEX IF NOT EXISTS idx_entries_work ON entries(work_id, position);
  CREATE INDEX IF NOT EXISTS idx_holdings_scribe ON holdings(scribe_id);
  CREATE INDEX IF NOT EXISTS idx_souls_name ON souls(name);
  CREATE INDEX IF NOT EXISTS idx_mentions_soul ON mentions(soul_id);
  CREATE INDEX IF NOT EXISTS idx_mentions_work ON mentions(work_id);
`;

// Migrate older databases that predate newer columns.
function migrate() {
  const scols = all(`PRAGMA table_info(scribes)`).map(c => c.name);
  if (!scols.includes('is_admin')) {
    db.run(`ALTER TABLE scribes ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
  }
  const wcols = all(`PRAGMA table_info(works)`).map(c => c.name);
  if (!wcols.includes('archived')) {
    db.run(`ALTER TABLE works ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
    // Grandfather every pre-existing work into the Master Archive (one-time, on first add of the column).
    db.run(`UPDATE works SET archived=1`);
  }
}

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
  create: { run: (p) => { run(`INSERT INTO scribes (id,codename,passphrase,is_admin) VALUES (?,?,?,?)`, [p.id, p.codename, p.passphrase, p.is_admin ? 1 : 0]); } },
  findByCodename: { get: (codename) => get(`SELECT * FROM scribes WHERE lower(codename)=lower(?)`, [codename]) },
  findById:       { get: (id)       => get(`SELECT * FROM scribes WHERE id=?`, [id]) },
  setAdmin:       { run: (id, val)  => { run(`UPDATE scribes SET is_admin=? WHERE id=?`, [val ? 1 : 0, id]); } },
  setPass:        { run: (id, hash) => { run(`UPDATE scribes SET passphrase=? WHERE id=?`, [hash, id]); } },
  deleteById:     { run: (id)       => { run(`DELETE FROM scribes WHERE id=?`, [id]); } },
  countAdmins:    { get: ()         => get(`SELECT COUNT(*) as n FROM scribes WHERE is_admin=1`) },
  all: { all: () => all(`
    SELECT s.id, s.codename, s.is_admin, s.created_at,
           (SELECT COUNT(*) FROM holdings h WHERE h.scribe_id=s.id) as holding_count,
           (SELECT COUNT(*) FROM works w WHERE w.scribe_id=s.id) as authored_count
    FROM scribes s ORDER BY s.is_admin DESC, lower(s.codename) ASC
  `) },
};

const holdings = {
  assign:   { run: (p) => { run(`INSERT OR IGNORE INTO holdings (id,scribe_id,work_id,assigned_by) VALUES (?,?,?,?)`,
    [p.id, p.scribe_id, p.work_id, p.assigned_by||null]); } },
  unassign: { run: (scribe_id, work_id) => { run(`DELETE FROM holdings WHERE scribe_id=? AND work_id=?`, [scribe_id, work_id]); } },
  deleteByScribe: { run: (scribe_id) => { run(`DELETE FROM holdings WHERE scribe_id=?`, [scribe_id]); } },
  deleteByWork:   { run: (work_id)   => { run(`DELETE FROM holdings WHERE work_id=?`, [work_id]); } },
  has:      { get: (scribe_id, work_id) => get(`SELECT 1 as ok FROM holdings WHERE scribe_id=? AND work_id=?`, [scribe_id, work_id]) },
  workIdsForScribe: { all: (scribe_id) => all(`SELECT work_id FROM holdings WHERE scribe_id=?`, [scribe_id]) },
};

const works = {
  create: { run: (p) => { run(`INSERT INTO works (id,scribe_id,type,title,author,subtitle,meta,archived) VALUES (?,?,?,?,?,?,?,?)`,
    [p.id, p.scribe_id, p.type, p.title, p.author||'', p.subtitle||'', p.meta||'{}', p.archived ? 1 : 0]); } },

  setArchived: { run: (id, val) => { run(`UPDATE works SET archived=? WHERE id=?`, [val ? 1 : 0, id]); } },

  update: { run: (p) => { run(`UPDATE works SET title=?,author=?,subtitle=?,meta=?,updated_at=strftime('%s','now') WHERE id=? AND scribe_id=?`,
    [p.title, p.author||'', p.subtitle||'', p.meta||'{}', p.id, p.scribe_id]); } },

  delete: { run: (id, scribe_id) => { run(`DELETE FROM works WHERE id=? AND scribe_id=?`, [id, scribe_id]); } },

  hardDelete: { run: (id) => { run(`DELETE FROM works WHERE id=?`, [id]); } },

  findById: { get: (id) => get(`SELECT * FROM works WHERE id=?`, [id]) },

  allPublic: { all: () => all(`
    SELECT w.*, s.codename as scribe_name,
           (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count
    FROM works w JOIN scribes s ON s.id=w.scribe_id
    ORDER BY w.created_at DESC
  `) },

  // The Master Archive: works the curator has adopted (or that were grandfathered in).
  masterArchive: { all: () => all(`
    SELECT w.*, s.codename as scribe_name,
           (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count,
           (SELECT COUNT(*) FROM holdings h WHERE h.work_id=w.id) as copies_out
    FROM works w JOIN scribes s ON s.id=w.scribe_id
    WHERE w.archived=1
    ORDER BY w.created_at DESC
  `) },

  // Operator-authored works not yet adopted — candidates for the Master Archive.
  pendingAdoption: { all: () => all(`
    SELECT w.*, s.codename as scribe_name,
           (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count
    FROM works w JOIN scribes s ON s.id=w.scribe_id
    WHERE w.archived=0
    ORDER BY w.created_at DESC
  `) },

  byScribe: { all: (scribe_id) => all(`
    SELECT w.*, (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count
    FROM works w WHERE w.scribe_id=? ORDER BY w.created_at DESC
  `, [scribe_id]) },

  // A member's personal library: works they authored plus works assigned to them.
  forScribeLibrary: { all: (scribe_id) => all(`
    SELECT w.*, s.codename as scribe_name,
           (SELECT COUNT(*) FROM entries e WHERE e.work_id=w.id) as entry_count,
           (w.scribe_id=? ) as is_own
    FROM works w JOIN scribes s ON s.id=w.scribe_id
    WHERE w.scribe_id=? OR w.id IN (SELECT work_id FROM holdings WHERE scribe_id=?)
    ORDER BY w.created_at DESC
  `, [scribe_id, scribe_id, scribe_id]) },
};

// The Index of Souls — House Mournstar's record of the people of Skyrim.
const souls = {
  create: { run: (p) => { run(`INSERT INTO souls (id,name,race,status,known,created_by) VALUES (?,?,?,?,?,?)`,
    [p.id, p.name, p.race||'', p.status||'', p.known||'', p.created_by||null]); } },
  update: { run: (p) => { run(`UPDATE souls SET name=?,race=?,status=?,known=?,updated_at=strftime('%s','now') WHERE id=?`,
    [p.name, p.race||'', p.status||'', p.known||'', p.id]); } },
  findById:   { get: (id)   => get(`SELECT s.*, sc.codename as recorder FROM souls s LEFT JOIN scribes sc ON sc.id=s.created_by WHERE s.id=?`, [id]) },
  findByName: { get: (name) => get(`SELECT * FROM souls WHERE lower(name)=lower(?)`, [name]) },
  recent:     { all: (n)    => all(`SELECT * FROM souls ORDER BY updated_at DESC LIMIT ?`, [n||3]) },
  all:        { all: ()     => all(`SELECT s.*, sc.codename as recorder FROM souls s LEFT JOIN scribes sc ON sc.id=s.created_by ORDER BY lower(s.name) ASC`) },
  count:      { get: ()     => get(`SELECT COUNT(*) as n FROM souls`) },
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
  migrate();
  persist(); // save schema immediately
  return db;
}

// ── The boards (Notice Board + Antechamber) ─────────────────
const posts = {
  create: { run: (p) => { run(
    `INSERT INTO posts (id,board,scribe_id,parent_id,kind,title,body) VALUES (?,?,?,?,?,?,?)`,
    [p.id, p.board, p.scribe_id, p.parent_id || null, p.kind || null, p.title || '', p.body || '']); } },

  findById: { get: (id) => get(`SELECT * FROM posts WHERE id=?`, [id]) },

  // Top-level threads on a board, newest first.
  threads: { all: (board) => all(`
    SELECT p.*, s.codename as scribe_name,
           (SELECT COUNT(*) FROM posts r WHERE r.parent_id=p.id) as reply_count
    FROM posts p JOIN scribes s ON s.id=p.scribe_id
    WHERE p.board=? AND p.parent_id IS NULL
    ORDER BY p.created_at DESC
  `, [board]) },

  repliesFor: { all: (id) => all(`
    SELECT p.*, s.codename as scribe_name
    FROM posts p JOIN scribes s ON s.id=p.scribe_id
    WHERE p.parent_id=? ORDER BY p.created_at ASC
  `, [id]) },

  recent: { all: (board, n) => all(`
    SELECT p.*, s.codename as scribe_name
    FROM posts p JOIN scribes s ON s.id=p.scribe_id
    WHERE p.board=? AND p.parent_id IS NULL
    ORDER BY p.created_at DESC LIMIT ?
  `, [board, n]) },

  // Removing a thread takes its replies with it.
  delete: { run: (id) => { run(`DELETE FROM posts WHERE id=? OR parent_id=?`, [id, id]); } },
};

module.exports = { initDb, db: () => db, scribes, works, entries, holdings, souls, posts, saveEntriesForWork };
