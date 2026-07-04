'use strict';

const express      = require('express');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt       = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path         = require('path');

const { initDb, scribes, works, entries, saveEntriesForWork } = require('./db');
const { seed } = require('./seed');

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
app.post('/api/auth/register', async (req, res) => {
  try {
    const codename   = sanitize(req.body.codename, 40);
    const passphrase = sanitize(req.body.passphrase, 200);
    if (!codename || codename.length < 2)
      return res.status(400).json({ error: 'Codename must be at least 2 characters.' });
    if (!passphrase || passphrase.length < 4)
      return res.status(400).json({ error: 'Passphrase must be at least 4 characters.' });
    if (!/^[\w\s\-'.]+$/.test(codename))
      return res.status(400).json({ error: 'Codename may only contain letters, numbers, spaces, hyphens, and apostrophes.' });
    const existing = scribes.findByCodename.get(codename);
    if (existing) return res.status(409).json({ error: 'That codename is already claimed.' });
    const hashed = await bcrypt.hash(passphrase, 10);
    const id = uuidv4();
    scribes.create.run({ id, codename, passphrase: hashed });
    req.session.scribe = { id, codename };
    return res.json({ ok: true, codename });
  } catch(err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const codename   = sanitize(req.body.codename, 40);
    const passphrase = sanitize(req.body.passphrase, 200);
    const scribe = scribes.findByCodename.get(codename);
    if (!scribe) return res.status(401).json({ error: 'Unknown codename.' });
    const match = await bcrypt.compare(passphrase, scribe.passphrase);
    if (!match) return res.status(401).json({ error: 'Incorrect passphrase.' });
    req.session.scribe = { id: scribe.id, codename: scribe.codename };
    return res.json({ ok: true, codename: scribe.codename });
  } catch(err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ ok: true }); });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session?.scribe) return res.json({ codename: req.session.scribe.codename, id: req.session.scribe.id });
  return res.json({ codename: null });
});

// ── LIBRARY ─────────────────────────────────────────────────
app.get('/api/library', (req, res) => {
  try {
    const all = works.allPublic.all();
    res.json({ books: all.filter(w=>w.type==='book'), parchments: all.filter(w=>w.type==='parchment') });
  } catch(err) { res.status(500).json({ error: 'Could not load the archive.' }); }
});

app.get('/api/works/:id', (req, res) => {
  try {
    const work = works.findById.get(req.params.id);
    if (!work) return res.status(404).json({ error: 'Not found.' });
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
    works.create.run({ id, scribe_id: req.session.scribe.id, type,
      title: sanitize(title,200), author: sanitize(author,200),
      subtitle: sanitize(subtitle,300), meta: JSON.stringify(meta||{}) });
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

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── BOOT ────────────────────────────────────────────────────
initDb().then(async () => {
  await seed(null, scribes, works, entries, saveEntriesForWork);
  app.listen(PORT, () => console.log(`✦ The Black Archive is open on port ${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
