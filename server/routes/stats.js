const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/', (req, res) => {
  const userId = req.session.userId;

  const openTasks = db
    .prepare("SELECT COUNT(*) AS c FROM tasks WHERE user_id = ? AND status != 'done'")
    .get(userId).c;

  const upcomingEventsThisWeek = db
    .prepare(
      `SELECT COUNT(*) AS c FROM events
       WHERE user_id = ? AND start_at >= datetime('now') AND start_at < datetime('now', '+7 days')`
    )
    .get(userId).c;

  const totalContacts = db.prepare('SELECT COUNT(*) AS c FROM contacts WHERE user_id = ?').get(userId).c;

  const tasksCompletedThisWeek = db
    .prepare(
      `SELECT COUNT(*) AS c FROM tasks
       WHERE user_id = ? AND status = 'done' AND completed_at >= datetime('now', '-7 days')`
    )
    .get(userId).c;

  res.json({ openTasks, upcomingEventsThisWeek, totalContacts, tasksCompletedThisWeek });
});

module.exports = router;
