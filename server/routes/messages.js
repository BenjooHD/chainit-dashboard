const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/unread-count', (req, res) => {
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM messages WHERE recipient_id = ? AND read_at IS NULL')
    .get(req.session.userId);
  res.json({ count: row.c });
});

router.get('/users', (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.title,
        (SELECT MAX(m.created_at) FROM messages m
         WHERE (m.sender_id = ? AND m.recipient_id = u.id) OR (m.sender_id = u.id AND m.recipient_id = ?)
        ) AS last_message_at,
        (SELECT COUNT(*) FROM messages m
         WHERE m.sender_id = u.id AND m.recipient_id = ? AND m.read_at IS NULL
        ) AS unread_count
       FROM users u
       WHERE u.id != ?
       ORDER BY last_message_at IS NULL ASC, last_message_at DESC, u.username COLLATE NOCASE ASC`
    )
    .all(req.session.userId, req.session.userId, req.session.userId, req.session.userId);
  res.json(
    rows.map((r) => ({
      id: r.id,
      username: r.username,
      title: r.title || null,
      lastMessageAt: r.last_message_at,
      unreadCount: r.unread_count,
    }))
  );
});

router.get('/:userId', (req, res) => {
  const otherId = Number(req.params.userId);
  const other = db.prepare('SELECT id FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ error: 'User not found' });

  db.prepare(
    'UPDATE messages SET read_at = datetime(\'now\') WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL'
  ).run(otherId, req.session.userId);

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
