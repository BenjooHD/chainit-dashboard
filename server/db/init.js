const fs = require('fs');
const path = require('path');
const db = require('./connection');

function columnExists(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function migrate() {
  // One-time cleanup of throwaway test accounts created while verifying the
  // deploy. Targeted by exact email, not a pattern — never touches a real
  // account. Safe to run every boot: a no-op once they're gone.
  const testEmails = [
    'liveuser@example.com',
    'probe-check@example.com',
    'probe-check-2@example.com',
    'probe-check-3@example.com',
    'probe-check-4@example.com',
  ];
  const deleteTestUser = db.prepare('DELETE FROM users WHERE email = ?');
  for (const email of testEmails) deleteTestUser.run(email);

  // Additive migrations for databases created before these columns existed.
  // Never drop/recreate — production already has real accounts in it.
  if (!columnExists('users', 'is_admin')) {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnExists('users', 'title')) {
    db.exec('ALTER TABLE users ADD COLUMN title TEXT');
  }

  // Bootstrap: if no admin exists yet, promote the earliest-created account.
  // Covers both a fresh install's first registrant and an existing database
  // that predates the admin system (e.g. the very first production account).
  const anyAdmin = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (!anyAdmin) {
    const first = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
    if (first) {
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(first.id);
    }
  }
}

function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  migrate();
}

module.exports = initDb;
