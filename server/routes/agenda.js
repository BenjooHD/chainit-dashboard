const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

const canView = requirePermission('agenda', 'view');
const canEdit = requirePermission('agenda', 'edit');

function serialize(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    done: !!row.done,
    addedBy: row.username || null,
    createdAt: row.created_at,
  };
}

router.get('/', canView, (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, u.username FROM agenda_items a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.done ASC, a.created_at ASC`
    )
    .all();
  res.json(rows.map(serialize));
});

router.post('/', canEdit, (req, res) => {
  const { title, notes } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'title is required' });

  const result = db
    .prepare('INSERT INTO agenda_items (user_id, title, notes) VALUES (?, ?, ?)')
    .run(req.session.userId, String(title).trim(), notes || null);

  const row = db
    .prepare('SELECT a.*, u.username FROM agenda_items a LEFT JOIN users u ON u.id = a.user_id WHERE a.id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(serialize(row));
});

router.patch('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM agenda_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const { title, notes, done } = req.body || {};
  const nextTitle = title !== undefined ? String(title).trim() : existing.title;
  const nextNotes = notes !== undefined ? notes : existing.notes;
  const nextDone = done !== undefined ? (done ? 1 : 0) : existing.done;
  if (!nextTitle) return res.status(400).json({ error: 'title cannot be empty' });

  db.prepare('UPDATE agenda_items SET title = ?, notes = ?, done = ? WHERE id = ?').run(
    nextTitle,
    nextNotes,
    nextDone,
    req.params.id
  );

  const row = db
    .prepare('SELECT a.*, u.username FROM agenda_items a LEFT JOIN users u ON u.id = a.user_id WHERE a.id = ?')
    .get(req.params.id);
  res.json(serialize(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM agenda_items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});

module.exports = router;
