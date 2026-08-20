// db.js
// Everything to do with the database lives here so server.js stays readable.

const Database = require('better-sqlite3');
const path = require('path');

// On my laptop the database is just a file next to the code.
// On the server I set DB_PATH so it can live on a disk that survives restarts.
const dbFile = process.env.DB_PATH || path.join(__dirname, 'attendance.db');
const db = new Database(dbFile);

// Two tables: one for the class/event, one for the people who showed up.
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    code        TEXT NOT NULL UNIQUE,
    is_open     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   INTEGER NOT NULL,
    student_id   TEXT NOT NULL,
    student_name TEXT NOT NULL,
    checked_in_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    UNIQUE (session_id, student_id)
  );
`);

module.exports = db;
