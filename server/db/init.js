const fs = require('fs');
const path = require('path');
const db = require('./connection');

function columnExists(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function tableSql(table) {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
  return row ? row.sql : '';
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
  if (!columnExists('events', 'priority')) {
    db.exec("ALTER TABLE events ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'");
  }
  if (!columnExists('projects', 'description')) {
    db.exec('ALTER TABLE projects ADD COLUMN description TEXT');
  }
  if (!columnExists('projects', 'status')) {
    db.exec("ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  if (!columnExists('tasks', 'assignee_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
  }
  if (!columnExists('messages', 'read_at')) {
    db.exec('ALTER TABLE messages ADD COLUMN read_at TEXT');
  }
  if (!columnExists('events', 'recurrence_group')) {
    db.exec('ALTER TABLE events ADD COLUMN recurrence_group TEXT');
  }

  // SQLite can't ALTER a CHECK constraint, so widening the allowed `area`
  // values means recreating the table and copying rows.
  if (!tableSql('permissions').includes("'mail'")) {
    db.exec(`
      CREATE TABLE permissions_new (
        user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area     TEXT NOT NULL CHECK (area IN ('calendar','tasks','contacts','projects','mail')),
        can_view INTEGER NOT NULL DEFAULT 0,
        can_edit INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, area)
      );
      INSERT INTO permissions_new SELECT * FROM permissions;
      DROP TABLE permissions;
      ALTER TABLE permissions_new RENAME TO permissions;
    `);
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
