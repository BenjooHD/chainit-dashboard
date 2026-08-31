const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/users', (req, res) => {
  const rows = db
    .prepare('SELECT id, username, title FROM users WHERE id != ? ORDER BY username COLLATE NOCASE ASC')
    .all(req.session.userId);
  res.json(rows.map((r) => ({ id: r.id, username: r.username, title: r.title || null })));
});

router.get('/:userId', (req, res) => {
  const otherId = Number(req.params.userId);
  const other = db.prepare('SELECT id FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ error: 'User not found' });

  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
       ORDER BY created_at ASC, id ASC`
    )
    .all(req.session.userId, otherId, otherId, req.session.userId);

  res.json(
    rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      recipientId: r.recipient_id,
      body: r.body,
      createdAt: r.created_at,
      mine: r.sender_id === req.session.userId,
    }))
  );
});

router.post('/:userId', (req, res) => {
  const otherId = Number(req.params.userId);
  const other = db.prepare('SELECT id FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ error: 'User not found' });

  const { body } = req.body || {};
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: 'body is required' });
  }
  if (otherId === req.session.userId) {
    return res.status(400).json({ error: 'Cannot message yourself' });
  }

  const result = db
    .prepare('INSERT INTO messages (sender_id, recipient_id, body) VALUES (?, ?, ?)')
    .run(req.session.userId, otherId, String(body).trim());

  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
    mine: true,
  });
});

module.exports = router;
