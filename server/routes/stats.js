const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/', (req, res) => {
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  let perms = { calendar: true, tasks: true, contacts: true };
  if (!user.is_admin) {
    const rows = db
      .prepare('SELECT area, can_view FROM permissions WHERE user_id = ?')
      .all(req.session.userId);
    perms = { calendar: false, tasks: false, contacts: false };
    for (const row of rows) perms[row.area] = !!row.can_view;
  }

  if (!perms.calendar && !perms.tasks && !perms.contacts) {
    return res.status(403).json({ error: 'No permission for any area', code: 'NO_PERMISSION' });
  }

  const openTasks = perms.tasks
    ? db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status != 'done'").get().c
    : null;

  const upcomingEventsThisWeek = perms.calendar
    ? db
        .prepare(
          `SELECT COUNT(*) AS c FROM events
           WHERE start_at >= datetime('now') AND start_at < datetime('now', '+7 days')`
        )
        .get().c
    : null;

  const totalContacts = perms.contacts ? db.prepare('SELECT COUNT(*) AS c FROM contacts').get().c : null;

  const tasksCompletedThisWeek = perms.tasks
    ? db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks
           WHERE status = 'done' AND completed_at >= datetime('now', '-7 days')`
        )
        .get().c
    : null;

  res.json({ openTasks, upcomingEventsThisWeek, totalContacts, tasksCompletedThisWeek });
});

module.exports = router;
