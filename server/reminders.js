const db = require('./db/connection');
const { sendReminderEmail } = require('./mail');

const REMINDER_HOUR_UTC = 7; // roughly 8-9am in Germany depending on DST
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const WINDOW_DAYS = 2;

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysStr(base, days) {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function canView(userId, isAdmin, area) {
  if (isAdmin) return true;
  const perm = db.prepare('SELECT can_view FROM permissions WHERE user_id = ? AND area = ?').get(userId, area);
  return !!(perm && perm.can_view);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function buildDigestForUser(user, today, windowEnd) {
  const sections = [];

  if (canView(user.id, user.is_admin, 'tasks')) {
    const overdue = db
      .prepare(
        `SELECT title, due_date FROM tasks
         WHERE status != 'done' AND due_date IS NOT NULL AND due_date < ?
           AND (assignee_id = ? OR (assignee_id IS NULL AND user_id = ?))
         ORDER BY due_date ASC`
      )
      .all(today, user.id, user.id);
    const dueSoon = db
      .prepare(
        `SELECT title, due_date FROM tasks
         WHERE status != 'done' AND due_date IS NOT NULL AND due_date >= ? AND due_date <= ?
           AND (assignee_id = ? OR (assignee_id IS NULL AND user_id = ?))
         ORDER BY due_date ASC`
      )
      .all(today, windowEnd, user.id, user.id);

    if (overdue.length > 0) {
      sections.push({
        title: `Überfällige Aufgaben (${overdue.length})`,
        items: overdue.map((t) => `${t.title} — fällig ${formatDate(t.due_date)}`),
      });
    }
    if (dueSoon.length > 0) {
      sections.push({
        title: `Bald fällige Aufgaben (${dueSoon.length})`,
        items: dueSoon.map((t) => `${t.title} — fällig ${formatDate(t.due_date)}`),
      });
    }
  }

  if (canView(user.id, user.is_admin, 'calendar')) {
    const todayStart = `${today}T00:00:00`;
    const windowEndEnd = `${windowEnd}T23:59:59`;
    const events = db
      .prepare(
        `SELECT title, start_at FROM events
         WHERE priority = 'high' AND start_at >= ? AND start_at <= ?
         ORDER BY start_at ASC`
      )
      .all(todayStart, windowEndEnd);
    if (events.length > 0) {
      sections.push({
        title: `Wichtige Termine (${events.length})`,
        items: events.map((e) => `${e.title} — ${formatDateTime(e.start_at)}`),
      });
    }
  }

  if (canView(user.id, user.is_admin, 'projects')) {
    const deadlines = db
      .prepare(
        `SELECT name, deadline FROM projects
         WHERE status = 'active' AND deadline IS NOT NULL AND deadline >= ? AND deadline <= ? AND owner_id = ?
         ORDER BY deadline ASC`
      )
      .all(today, windowEnd, user.id);
    if (deadlines.length > 0) {
      sections.push({
        title: `Projekt-Deadlines (${deadlines.length})`,
        items: deadlines.map((p) => `${p.name} — fällig ${formatDate(p.deadline)}`),
      });
    }
  }

  return sections;
}

async function sendDailyDigests() {
  const today = todayStr();
  const windowEnd = addDaysStr(today, WINDOW_DAYS);

  const users = db.prepare('SELECT id, username, email, is_admin FROM users WHERE email_verified = 1').all();

  for (const user of users) {
    const sections = buildDigestForUser(user, today, windowEnd);
    if (sections.length === 0) continue;
    try {
      await sendReminderEmail({ to: user.email, username: user.username, sections });
    } catch (err) {
      console.error(`[reminders] Failed to send digest to ${user.email}:`, err.message);
    }
  }

  db.prepare('INSERT OR IGNORE INTO reminder_runs (run_date) VALUES (?)').run(today);
}

async function checkAndMaybeSend() {
  const today = todayStr();
  const alreadySent = db.prepare('SELECT 1 FROM reminder_runs WHERE run_date = ?').get(today);
  if (alreadySent) return;
  if (new Date().getUTCHours() < REMINDER_HOUR_UTC) return;

  try {
    await sendDailyDigests();
  } catch (err) {
    console.error('[reminders] Daily digest run failed:', err);
  }
}

function scheduleReminders() {
  checkAndMaybeSend();
  setInterval(checkAndMaybeSend, CHECK_INTERVAL_MS);
}

module.exports = { scheduleReminders };
