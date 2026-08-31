const express = require('express');
const db = require('../db/connection');

const router = express.Router();

function serializeContact(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY full_name ASC')
    .all(req.session.userId);
  res.json(rows.map(serializeContact));
});

router.post('/', (req, res) => {
  const { fullName, company, email, phone, notes } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });

  const result = db
    .prepare(
      'INSERT INTO contacts (user_id, full_name, company, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(req.session.userId, fullName, company || null, email || null, phone || null, notes || null);

  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeContact(row));
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const { fullName, company, email, phone, notes } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });

  db.prepare(
    'UPDATE contacts SET full_name = ?, company = ?, email = ?, phone = ?, notes = ? WHERE id = ? AND user_id = ?'
  ).run(fullName, company || null, email || null, phone || null, notes || null, req.params.id, req.session.userId);

  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json(serializeContact(row));
});

router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.json({ ok: true });
});

module.exports = router;
