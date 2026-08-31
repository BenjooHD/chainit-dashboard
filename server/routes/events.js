const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

const canView = requirePermission('calendar', 'view');
const canEdit = requirePermission('calendar', 'edit');

function serializeEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    createdAt: row.created_at,
  };
}

router.get('/', canView, (req, res) => {
  const { month } = req.query;
  let rows;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const monthStart = `${month}-01T00:00:00`;
    const [y, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    const monthEnd = `${nextMonth}-01T00:00:00`;
    rows = db
      .prepare(`SELECT * FROM events WHERE start_at < ? AND end_at >= ? ORDER BY start_at ASC`)
      .all(monthEnd, monthStart);
  } else {
    rows = db.prepare('SELECT * FROM events ORDER BY start_at ASC').all();
  }
  res.json(rows.map(serializeEvent));
});

router.post('/', canEdit, (req, res) => {
  const { title, description, startAt, endAt, location } = req.body || {};
  if (!title || !startAt || !endAt) {
    return res.status(400).json({ error: 'title, startAt and endAt are required' });
  }

  const result = db
    .prepare(
      'INSERT INTO events (user_id, title, description, start_at, end_at, location) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(req.session.userId, title, description || null, startAt, endAt, location || null);

  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeEvent(row));
});

router.put('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { title, description, startAt, endAt, location } = req.body || {};
  if (!title || !startAt || !endAt) {
    return res.status(400).json({ error: 'title, startAt and endAt are required' });
  }

  db.prepare(
    'UPDATE events SET title = ?, description = ?, start_at = ?, end_at = ?, location = ? WHERE id = ?'
  ).run(title, description || null, startAt, endAt, location || null, req.params.id);

  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(serializeEvent(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true });
});

module.exports = router;
