CREATE TABLE IF NOT EXISTS users (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  username                 TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email                    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash            TEXT NOT NULL,
  email_verified           INTEGER NOT NULL DEFAULT 0,
  verification_token       TEXT,
  verification_expires_at  TEXT,
  is_admin                 INTEGER NOT NULL DEFAULT 0,
  title                    TEXT,
  created_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Per-user, per-area access control for the shared team areas (calendar/tasks/contacts).
-- Admins bypass this table entirely. A user with no row for an area has no access to it.
CREATE TABLE IF NOT EXISTS permissions (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area     TEXT NOT NULL CHECK (area IN ('calendar','tasks','contacts','projects','mail','agenda','costs','invoices','feedback')),
  can_view INTEGER NOT NULL DEFAULT 0,
  can_edit INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, area)
);

CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  read_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, sender_id);

-- Generic in-app notifications (task assignments today, room for more types later).
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  read_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','done','archived')),
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  color       TEXT NOT NULL DEFAULT '#c4b5fd',
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  deadline    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  original_filename TEXT NOT NULL,
  stored_filename   TEXT NOT NULL UNIQUE,
  mime_type         TEXT,
  size_bytes        INTEGER NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);

-- Google Drive (or any external) links shared alongside uploaded files.
-- Kept in a separate table instead of widening `documents` so the existing
-- NOT NULL file columns there never need relaxing for a production DB.
CREATE TABLE IF NOT EXISTS document_links (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_document_links_project ON document_links(project_id);

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  assignee_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  due_date     TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  start_at    TEXT NOT NULL,
  end_at      TEXT NOT NULL,
  location    TEXT,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  recurrence_group TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  company    TEXT,
  email      TEXT,
  phone      TEXT,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS costs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  amount     REAL NOT NULL,
  category   TEXT,
  cost_date  TEXT,
  status     TEXT NOT NULL DEFAULT 'ausgabe' CHECK (status IN ('geplant','ausgabe')),
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_costs_user ON costs(user_id);

CREATE TABLE IF NOT EXISTS agenda_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  notes      TEXT,
  done       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Persistent session store so logins survive a server restart/redeploy
-- instead of the default express-session MemoryStore losing everyone.
CREATE TABLE IF NOT EXISTS sessions (
  sid     TEXT PRIMARY KEY,
  sess    TEXT NOT NULL,
  expires INTEGER NOT NULL
);

-- One row per calendar day a reminder digest run has completed, so the
-- interval-based scheduler in server/reminders.js never double-sends.
CREATE TABLE IF NOT EXISTS reminder_runs (
  run_date TEXT PRIMARY KEY
);

-- Single-row table (id is always 1) holding the company/bank details and
-- VAT mode used to render every invoice plus the next sequential number.
CREATE TABLE IF NOT EXISTS invoice_settings (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  company_name     TEXT,
  company_address  TEXT,
  tax_id           TEXT,
  vat_mode         TEXT NOT NULL DEFAULT 'unset' CHECK (vat_mode IN ('unset', 'standard', 'kleinunternehmer')),
  default_vat_rate REAL NOT NULL DEFAULT 19,
  bank_name        TEXT,
  bank_iban        TEXT,
  bank_bic         TEXT,
  footer_note      TEXT,
  invoice_prefix   TEXT NOT NULL DEFAULT 'RE',
  next_seq         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS invoices (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number    TEXT NOT NULL UNIQUE,
  contact_id        INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  customer_name     TEXT NOT NULL,
  customer_address  TEXT,
  issue_date        TEXT NOT NULL,
  service_date      TEXT,
  due_date          TEXT,
  vat_mode          TEXT NOT NULL DEFAULT 'standard' CHECK (vat_mode IN ('standard', 'kleinunternehmer')),
  vat_rate          REAL NOT NULL DEFAULT 19,
  status            TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'bezahlt', 'storniert')),
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity    REAL NOT NULL DEFAULT 1,
  unit_price  REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS feedback_posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'idee' CHECK (type IN ('idee', 'kritik', 'lob', 'verbesserung')),
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_posts_created ON feedback_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
