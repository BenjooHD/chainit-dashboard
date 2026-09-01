const express = require('express');
const db = require('../db/connection');

const router = express.Router();

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    link: row.link,
    read: !!row.read_at,
    createdAt: row.created_at,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(req.session.userId);
  res.json(rows.map(serialize));
});

router.get('/unread-count', (req, res) => {
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .get(req.session.userId);
  res.json({ count: row.c });
});

router.post('/read-all', (req, res) => {
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(
    req.session.userId
  );
  res.json({ ok: true });
});

module.exports = router;
