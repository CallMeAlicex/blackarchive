'use strict';

const express      = require('express');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt       = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path         = require('path');

const { initDb, scribes, works, entries, holdings, saveEntriesForWork } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production-please';

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7*24*60*60*1000, httpOnly: true, sameSite: 'lax' }
}));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!req.session?.scribe?.id) return res.status(401).json({ error: 'You must be signed in.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.scribe?.id) return res.status(401).json({ error: 'You must be signed in.' });
  const me = scribes.findById.get(req.session.scribe.id);
  if (!me || !me.is_admin) return res.status(403).json({ error: 'Curator access only.' });
  req.me = me;
  next();
}

function isAdmin(req) {
  if (!req.session?.scribe?.id) return false;
  const me = scribes.findById.get(req.session.scribe.id);
  return !!(me && me.is_admin);
}

function sanitize(str, max=500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, max);
}

function workWithEntries(work) {
  const ents = entries.forWork.all(work.id);
  let meta = {};
  try { meta = JSON.parse(work.meta || '{}'); } catch(e) {}
  return { ...work, meta, entries: ents };
}

// ── AUTH ────────────────────────────────────────────────────
// Self-registration is disabled — accounts are created by a curator (see /api/admin/users).

app.post('/api/auth/login', async (req, res) => {
  try {
    const codename   = sanitize(req.body.codename, 40);
    const passphrase = sanitize(req.body.passphrase, 200);
    const scribe = scribes.findByCodename.get(codename);
    if (!scribe) return res.status(401).json({ error: 'Unknown codename.' });
    const match = await bcrypt.compare(passphrase, scribe.passphrase);
    if (!match) return res.status(401).json({ error: 'Incorrect passphrase.' });
    req.session.scribe = { id: scribe.id, codename: scribe.codename };
    return res.json({ ok: true, codename: scribe.codename, is_admin: !!scribe.is_admin });
  } catch(err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ ok: true }); });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session?.scribe) {
    const me = scribes.findById.get(req.session.scribe.id);
    return res.json({ codename: req.session.scribe.codename, id: req.session.scribe.id, is_admin: !!(me && me.is_admin) });
  }
  return res.json({ codename: null });
});

// ── LIBRARY ─────────────────────────────────────────────────
app.get('/api/library', requireAuth, (req, res) => {
  try {
    const admin = isAdmin(req);
    const all = admin ? works.allPublic.all() : works.forScribeLibrary.all(req.session.scribe.id);
    res.json({
      books: all.filter(w=>w.type==='book'),
      parchments: all.filter(w=>w.type==='parchment'),
      is_admin: admin
    });
  } catch(err) { res.status(500).json({ error: 'Could not load the archive.' }); }
});

app.get('/api/works/:id', requireAuth, (req, res) => {
  try {
    const work = works.findById.get(req.params.id);
    if (!work) return res.status(404).json({ error: 'Not found.' });
    const allowed = isAdmin(req)
      || work.scribe_id === req.session.scribe.id
      || holdings.has.get(req.session.scribe.id, work.id);
    if (!allowed) return res.status(403).json({ error: 'This volume has not been assigned to your library.' });
    const scribe = scribes.findById.get(work.scribe_id);
    res.json({ ...workWithEntries(work), scribe_name: scribe?.codename || 'Unknown' });
  } catch(err) { res.status(500).json({ error: 'Could not retrieve this work.' }); }
});

// ── CREATE / UPDATE / DELETE ────────────────────────────────
app.post('/api/works', requireAuth, (req, res) => {
  try {
    const { type, title, author, subtitle, meta, entries: ents } = req.body;
    if (!['book','parchment'].includes(type)) return res.status(400).json({ error: 'Invalid type.' });
    if (!sanitize(title)) return res.status(400).json({ error: 'A title is required.' });
    const id = uuidv4();
    // Curator-authored works enter the Master Archive directly; operator works stay
    // personal until the curator adopts them.
    works.create.run({ id, scribe_id: req.session.scribe.id, type,
      title: sanitize(title,200), author: sanitize(author,200),
      subtitle: sanitize(subtitle,300), meta: JSON.stringify(meta||{}), archived: isAdmin(req) ? 1 : 0 });
    if (Array.isArray(ents) && ents.length) {
      saveEntriesForWork(id, ents.map(e => ({ id: uuidv4(),
        title: sanitize(e.title,200), date_line: sanitize(e.date_line,200), body: sanitize(e.body,20000) })));
    }
    res.status(201).json(workWithEntries(works.findById.get(id)));
  } catch(err) { console.error(err); res.status(500).json({ error: 'Could not create this work.' }); }
});

app.put('/api/works/:id', requireAuth, (req, res) => {
  try {
    const work = works.findById.get(req.params.id);
    if (!work) return res.status(404).json({ error: 'Not found.' });
    if (work.scribe_id !== req.session.scribe.id) return res.status(403).json({ error: 'This is not yours to edit.' });
    const { title, author, subtitle, meta, entries: ents } = req.body;
    works.update.run({ id: req.params.id, scribe_id: req.session.scribe.id,
      title: sanitize(title||work.title,200), author: sanitize(author,200),
      subtitle: sanitize(subtitle,300), meta: JSON.stringify(meta||{}) });
    if (Array.isArray(ents)) {
      saveEntriesForWork(req.params.id, ents.map(e => ({ id: e.id||uuidv4(),
        title: sanitize(e.title,200), date_line: sanitize(e.date_line,200), body: sanitize(e.body,20000) })));
    }
    res.json(workWithEntries(works.findById.get(req.params.id)));
  } catch(err) { console.error(err); res.status(500).json({ error: 'Could not update this work.' }); }
});

app.delete('/api/works/:id', requireAuth, (req, res) => {
  try {
    const work = works.findById.get(req.params.id);
    if (!work) return res.status(404).json({ error: 'Not found.' });
    if (work.scribe_id !== req.session.scribe.id) return res.status(403).json({ error: 'This is not yours to destroy.' });
    works.delete.run(req.params.id, req.session.scribe.id);
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: 'Could not remove this work.' }); }
});

// ── ADMIN (curator only) ────────────────────────────────────
app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json({ users: scribes.all.all() });
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const codename   = sanitize(req.body.codename, 40);
    const passphrase = sanitize(req.body.passphrase, 200);
    if (!codename || codename.length < 2)
      return res.status(400).json({ error: 'Codename must be at least 2 characters.' });
    if (!passphrase || passphrase.length < 4)
      return res.status(400).json({ error: 'Passphrase must be at least 4 characters.' });
    if (!/^[\w\s\-'.]+$/.test(codename))
      return res.status(400).json({ error: 'Codename may only contain letters, numbers, spaces, hyphens, and apostrophes.' });
    if (scribes.findByCodename.get(codename))
      return res.status(409).json({ error: 'That codename is already claimed.' });
    const id = uuidv4();
    scribes.create.run({ id, codename, passphrase: await bcrypt.hash(passphrase, 10), is_admin: req.body.is_admin ? 1 : 0 });
    res.status(201).json({ ok: true, id, codename });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Could not create the account.' }); }
});

app.get('/api/admin/works', requireAdmin, (req, res) => {
  res.json({ works: works.allPublic.all() });
});

app.get('/api/admin/users/:id/holdings', requireAdmin, (req, res) => {
  res.json({ work_ids: holdings.workIdsForScribe.all(req.params.id).map(r => r.work_id) });
});

app.get('/api/admin/archive', requireAdmin, (req, res) => {
  res.json({ works: works.masterArchive.all() });
});

app.get('/api/admin/pending', requireAdmin, (req, res) => {
  res.json({ works: works.pendingAdoption.all() });
});

app.post('/api/admin/adopt', requireAdmin, (req, res) => {
  const work_id = sanitize(req.body.work_id, 60);
  if (!works.findById.get(work_id)) return res.status(404).json({ error: 'No such work.' });
  works.setArchived.run(work_id, 1);
  res.json({ ok: true });
});

app.post('/api/admin/release', requireAdmin, (req, res) => {
  const work_id = sanitize(req.body.work_id, 60);
  if (!works.findById.get(work_id)) return res.status(404).json({ error: 'No such work.' });
  works.setArchived.run(work_id, 0);
  res.json({ ok: true });
});

app.post('/api/admin/assign', requireAdmin, (req, res) => {
  try {
    const scribe_id = sanitize(req.body.scribe_id, 60);
    const work_id   = sanitize(req.body.work_id, 60);
    if (!scribes.findById.get(scribe_id)) return res.status(404).json({ error: 'No such account.' });
    const work = works.findById.get(work_id);
    if (!work) return res.status(404).json({ error: 'No such work.' });
    if (!work.archived) return res.status(400).json({ error: 'Adopt this work into the Master Archive before checking it out.' });
    holdings.assign.run({ id: uuidv4(), scribe_id, work_id, assigned_by: req.session.scribe.id });
    res.json({ ok: true });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Could not assign the copy.' }); }
});

app.post('/api/admin/unassign', requireAdmin, (req, res) => {
  try {
    const scribe_id = sanitize(req.body.scribe_id, 60);
    const work_id   = sanitize(req.body.work_id, 60);
    holdings.unassign.run(scribe_id, work_id);
    res.json({ ok: true });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Could not unassign the copy.' }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Ensure the curator (admin) account exists. Codename defaults to "K-M".
// On first boot with an ADMIN_PASS set, the account is created; if it already
// exists it is (re)promoted to admin, and its passphrase reset only if ADMIN_RESET=1.
async function ensureAdmin() {
  const NAME = process.env.ADMIN_NAME || 'K-M';
  const existing = scribes.findByCodename.get(NAME);
  if (existing) {
    if (!existing.is_admin) { scribes.setAdmin.run(existing.id, 1); console.log(`Promoted ${NAME} to curator.`); }
    if (process.env.ADMIN_PASS && process.env.ADMIN_RESET === '1') {
      scribes.setPass.run(existing.id, await bcrypt.hash(process.env.ADMIN_PASS, 10));
      console.log(`Reset ${NAME} passphrase.`);
    }
    return;
  }
  if (!process.env.ADMIN_PASS) {
    console.warn(`No curator account and no ADMIN_PASS set — set ADMIN_PASS to bootstrap the ${NAME} account.`);
    return;
  }
  scribes.create.run({ id: uuidv4(), codename: NAME, passphrase: await bcrypt.hash(process.env.ADMIN_PASS, 10), is_admin: 1 });
  console.log(`Bootstrapped curator account: ${NAME}`);
}

// ── BOOT ────────────────────────────────────────────────────
initDb().then(async () => {
  await ensureAdmin();
  app.listen(PORT, () => console.log(`✦ The Black Library is open on port ${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
