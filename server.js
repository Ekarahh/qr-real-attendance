// server.js
// QR attendance system - Express + SQLite.
//
// This file is the back end only. It answers the /api/... calls and hands out the
// finished React app that Vite builds into client/dist.
//
// How the app works:
//   1. The teacher logs in and creates a session (e.g. "CSC 201 - Friday").
//   2. The app makes a QR code that points at /s/<code>.
//   3. A student scans it with their phone camera, types their name + ID, and is marked present.
//   4. The teacher can look at the records and download them as a CSV file.

const express = require('express');
const cookieSession = require('cookie-session');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Where Vite puts the built React app.
const clientBuild = path.join(__dirname, 'client', 'dist');

// Hosts like Render sit in front of the app, so this lets Express see that the
// real address is https. Without it the QR codes would point at http and break.
app.set('trust proxy', true);

app.use(express.json());
app.use(cookieSession({
  name: 'attendance',
  keys: [process.env.SESSION_SECRET || 'please-change-me'],
  maxAge: 8 * 60 * 60 * 1000 // 8 hours
}));

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// Makes a short random code like "K7P2QX9M" for the QR link.
function makeCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1, they are easy to mix up
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += letters[bytes[i] % letters.length];
  }
  return code;
}

function now() {
  return new Date().toISOString();
}

// The teacher routes go through this, the student routes do not.
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  return res.status(401).json({ error: 'Please log in first' });
}

// ---------------------------------------------------------------------------
// API - login and logout
// ---------------------------------------------------------------------------

// React asks this when it starts up, to find out if the cookie is still good.
app.get('/api/me', (req, res) => {
  res.json({ loggedIn: Boolean(req.session && req.session.loggedIn) });
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Wrong password, please try again.' });
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// API - sessions
// ---------------------------------------------------------------------------

// Create a new attendance session.
app.post('/api/sessions', requireLogin, (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'Please give the session a title' });
  }

  const code = makeCode();
  const result = db.prepare(
    'INSERT INTO sessions (title, code, is_open, created_at) VALUES (?, ?, 1, ?)'
  ).run(title, code, now());

  res.json({ id: result.lastInsertRowid, title: title, code: code });
});

// List every session, newest first, with a count of who checked in.
app.get('/api/sessions', requireLogin, (req, res) => {
  const sessions = db.prepare(
    'SELECT s.*, (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) AS total ' +
    'FROM sessions s ORDER BY s.id DESC'
  ).all();
  res.json(sessions);
});

// One session plus its QR code image (a data URL that an <img> tag can show).
app.get('/api/sessions/:id', requireLogin, async (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Build the full link that the QR code should open.
  const baseUrl = process.env.BASE_URL || (req.protocol + '://' + req.get('host'));
  const checkinUrl = baseUrl + '/s/' + session.code;
  const qrImage = await QRCode.toDataURL(checkinUrl, { width: 400, margin: 2 });

  res.json({ session: session, checkinUrl: checkinUrl, qrImage: qrImage });
});

// Open or close a session. A closed session refuses new check-ins.
app.post('/api/sessions/:id/toggle', requireLogin, (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const newValue = session.is_open ? 0 : 1;
  db.prepare('UPDATE sessions SET is_open = ? WHERE id = ?').run(newValue, session.id);
  res.json({ is_open: newValue });
});

// ---------------------------------------------------------------------------
// API - check in and records
// ---------------------------------------------------------------------------

// The details a student needs before checking in. No login required here.
app.get('/api/public/sessions/:code', (req, res) => {
  const session = db.prepare('SELECT id, title, is_open FROM sessions WHERE code = ?')
    .get(req.params.code.toUpperCase());
  if (!session) {
    return res.status(404).json({ error: 'That QR code does not match any session' });
  }
  res.json(session);
});

// The student submits their name and ID.
app.post('/api/checkin', (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  const studentId = (req.body.studentId || '').trim();
  const studentName = (req.body.studentName || '').trim();

  if (!studentId || !studentName) {
    return res.status(400).json({ error: 'Both your name and your ID are required' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE code = ?').get(code);
  if (!session) {
    return res.status(404).json({ error: 'That QR code does not match any session' });
  }
  if (!session.is_open) {
    return res.status(403).json({ error: 'Attendance for this session is closed' });
  }

  // The UNIQUE rule in the database stops the same ID being saved twice, so I
  // watch for that error instead of running a second query to check first.
  try {
    db.prepare(
      'INSERT INTO attendance (session_id, student_id, student_name, checked_in_at) VALUES (?, ?, ?, ?)'
    ).run(session.id, studentId, studentName, now());
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'You have already checked in for this session' });
    }
    throw err;
  }

  res.json({ ok: true, title: session.title, name: studentName });
});

// All records, or just one session's records when ?session=<id> is given.
app.get('/api/records', requireLogin, (req, res) => {
  const sessionId = req.query.session;
  const sql =
    'SELECT a.id, a.student_id, a.student_name, a.checked_in_at, ' +
    's.title AS session_title, s.code AS session_code, s.id AS session_id ' +
    'FROM attendance a JOIN sessions s ON s.id = a.session_id';

  const rows = sessionId
    ? db.prepare(sql + ' WHERE a.session_id = ? ORDER BY a.id DESC').all(sessionId)
    : db.prepare(sql + ' ORDER BY a.id DESC').all();

  res.json(rows);
});

// Download the records as a CSV file that opens in Excel or Google Sheets.
// This is a normal link, not a fetch call, so the browser saves the file.
app.get('/export.csv', requireLogin, (req, res) => {
  const sessionId = req.query.session;
  const sql =
    'SELECT s.title AS session_title, s.code AS session_code, ' +
    'a.student_id, a.student_name, a.checked_in_at ' +
    'FROM attendance a JOIN sessions s ON s.id = a.session_id';

  const rows = sessionId
    ? db.prepare(sql + ' WHERE a.session_id = ? ORDER BY a.id').all(sessionId)
    : db.prepare(sql + ' ORDER BY a.id').all();

  // Wrap every value in quotes so a comma inside a name does not break the columns.
  function cell(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  const lines = ['Session,Code,Student ID,Name,Checked in at'];
  for (const row of rows) {
    lines.push([
      cell(row.session_title),
      cell(row.session_code),
      cell(row.student_id),
      cell(row.student_name),
      cell(row.checked_in_at)
    ].join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send(lines.join('\n'));
});

// ---------------------------------------------------------------------------
// the React app
// ---------------------------------------------------------------------------

// Serve the built files (the JavaScript bundle, the CSS, and so on).
app.use(express.static(clientBuild));

// React Router handles the addresses like /records and /s/K7P2QX9M in the
// browser, so every other address has to give back the same index.html and let
// React decide what to show. This runs after the API routes above, so it never
// swallows them.
app.get('*', (req, res) => {
  const indexFile = path.join(clientBuild, 'index.html');

  if (!fs.existsSync(indexFile)) {
    return res.status(503).send(
      'The React app has not been built yet. Run "npm run build" first, ' +
      'or run "npm run dev" inside the client folder while developing.'
    );
  }

  res.sendFile(indexFile);
});

app.listen(PORT, () => {
  console.log('Attendance API running on http://localhost:' + PORT);
});
