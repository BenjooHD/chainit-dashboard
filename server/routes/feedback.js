const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

const canView = requirePermission('feedback', 'view');
const VALID_TYPES = ['idee', 'kritik', 'lob', 'verbesserung'];

const FEEDBACK_SELECT = `
  SELECT f.*, u.username
  FROM feedback_posts f
  JOIN users u ON u.id = f.user_id
`;

function serializeFeedback(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    username: row.username,
    createdAt: row.created_at,
  };
}

router.get('/', canView, (req, res) => {
  const rows = db.prepare(`${FEEDBACK_SELECT} ORDER BY f.created_at DESC`).all();
  res.json(
    rows.map((row) => ({
      ...serializeFeedback(row),
      isMine: row.user_id === req.session.userId,
    }))
  );
});

router.post('/', canView, (req, res) => {
  const { type, message } = req.body || {};
  if (!message || !String(message).trim()) return res.status(400).json({ error: 'message is required' });
  const validType = VALID_TYPES.includes(type) ? type : 'idee';

  const result = db
    .prepare('INSERT INTO feedback_posts (user_id, type, message) VALUES (?, ?, ?)')
    .run(req.session.userId, validType, String(message).trim());

  const row = db.prepare(`${FEEDBACK_SELECT} WHERE f.id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ ...serializeFeedback(row), isMine: true });
});

router.delete('/:id', canView, (req, res) => {
  const existing = db.prepare('SELECT * FROM feedback_posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  const isOwner = existing.user_id === req.session.userId;
  if (!isOwner && !(user && user.is_admin)) {
    return res.status(403).json({ error: 'Only the author or an admin can delete this post' });
  }

  db.prepare('DELETE FROM feedback_posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
