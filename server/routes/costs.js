const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');
const { sendCsv } = require('../csv');

const router = express.Router();

const canView = requirePermission('costs', 'view');
const canEdit = requirePermission('costs', 'edit');
const VALID_STATUS = ['geplant', 'ausgabe'];

function serializeCost(row) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.cost_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

router.get('/', canView, (req, res) => {
  const rows = db.prepare('SELECT * FROM costs ORDER BY cost_date DESC, created_at DESC').all();
  res.json(rows.map(serializeCost));
});

router.get('/export.csv', canView, (req, res) => {
  const rows = db.prepare('SELECT * FROM costs ORDER BY cost_date DESC, created_at DESC').all();
  sendCsv(
    res,
    'kosten.csv',
    ['Titel', 'Betrag', 'Kategorie', 'Status', 'Datum', 'Notizen'],
    rows.map((r) => [r.title, r.amount, r.category, r.status, r.cost_date, r.notes])
  );
});

router.post('/', canEdit, (req, res) => {
  const { title, amount, category, date, status, notes } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'title is required' });
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount)) return res.status(400).json({ error: 'amount must be a number' });
  const validStatus = VALID_STATUS.includes(status) ? status : 'ausgabe';

  const result = db
    .prepare('INSERT INTO costs (user_id, title, amount, category, cost_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.session.userId, String(title).trim(), numAmount, category || null, date || null, validStatus, notes || null);

  const row = db.prepare('SELECT * FROM costs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeCost(row));
});

router.put('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM costs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Cost not found' });

  const { title, amount, category, date, status, notes } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'title is required' });
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount)) return res.status(400).json({ error: 'amount must be a number' });
  const validStatus = VALID_STATUS.includes(status) ? status : existing.status;

  db.prepare('UPDATE costs SET title = ?, amount = ?, category = ?, cost_date = ?, status = ?, notes = ? WHERE id = ?').run(
    String(title).trim(),
    numAmount,
    category || null,
    date || null,
    validStatus,
    notes || null,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM costs WHERE id = ?').get(req.params.id);
  res.json(serializeCost(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM costs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Cost not found' });
  res.json({ ok: true });
});

module.exports = router;
