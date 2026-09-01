const crypto = require('crypto');
const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

const canView = requirePermission('calendar', 'view');
const canEdit = requirePermission('calendar', 'edit');
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const RECURRENCE_STEP_DAYS = { daily: 1, weekly: 7, monthly: null }; // monthly handled separately
const MAX_OCCURRENCES = 52;

function serializeEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    priority: row.priority,
    recurrenceGroup: row.recurrence_group,
    createdAt: row.created_at,
  };
}

function addOccurrence(date, recurrence) {
  const d = new Date(date);
  if (recurrence === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + RECURRENCE_STEP_DAYS[recurrence]);
  }
  return d;
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
  const { title, description, startAt, endAt, location, priority, recurrence, recurrenceCount } = req.body || {};
  if (!title || !startAt || !endAt) {
    return res.status(400).json({ error: 'title, startAt and endAt are required' });
  }
  const validPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';
  const isRecurring = ['daily', 'weekly', 'monthly'].includes(recurrence);
  const count = isRecurring ? Math.min(Math.max(Number(recurrenceCount) || 1, 1), MAX_OCCURRENCES) : 1;
  const recurrenceGroup = isRecurring && count > 1 ? crypto.randomUUID() : null;

  const insert = db.prepare(
    'INSERT INTO events (user_id, title, description, start_at, end_at, location, priority, recurrence_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  let cursorStart = new Date(startAt);
  let cursorEnd = new Date(endAt);
  const insertedIds = [];
  for (let i = 0; i < count; i++) {
    const result = insert.run(
      req.session.userId,
      title,
      description || null,
      cursorStart.toISOString().slice(0, 19),
      cursorEnd.toISOString().slice(0, 19),
      location || null,
      validPriority,
      recurrenceGroup
    );
    insertedIds.push(result.lastInsertRowid);
    if (isRecurring) {
      cursorStart = addOccurrence(cursorStart, recurrence);
      cursorEnd = addOccurrence(cursorEnd, recurrence);
    }
  }

  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(insertedIds[0]);
  res.status(201).json({ ...serializeEvent(row), occurrencesCreated: insertedIds.length });
});

router.put('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { title, description, startAt, endAt, location, priority } = req.body || {};
  if (!title || !startAt || !endAt) {
    return res.status(400).json({ error: 'title, startAt and endAt are required' });
  }
  const validPriority = VALID_PRIORITIES.includes(priority) ? priority : existing.priority;

  db.prepare(
    'UPDATE events SET title = ?, description = ?, start_at = ?, end_at = ?, location = ?, priority = ? WHERE id = ?'
  ).run(title, description || null, startAt, endAt, location || null, validPriority, req.params.id);

  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(serializeEvent(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  if (req.query.series === 'true' && existing.recurrence_group) {
    db.prepare('DELETE FROM events WHERE recurrence_group = ?').run(existing.recurrence_group);
  } else {
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  }
  res.json({ ok: true });
});

module.exports = router;
