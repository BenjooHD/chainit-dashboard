const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

const canView = requirePermission('projects', 'view');
const canEdit = requirePermission('projects', 'edit');
const VALID_STATUS = ['active', 'done', 'archived'];

function serializeProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    color: row.color,
    createdAt: row.created_at,
    documentCount: row.document_count || 0,
  };
}

router.get('/', canView, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id) AS document_count
       FROM projects p ORDER BY p.created_at DESC`
    )
    .all();
  res.json(rows.map(serializeProject));
});

router.post('/', canEdit, (req, res) => {
  const { name, description, status, color } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required' });
  const validStatus = VALID_STATUS.includes(status) ? status : 'active';

  const result = db
    .prepare('INSERT INTO projects (user_id, name, description, status, color) VALUES (?, ?, ?, ?, ?)')
    .run(req.session.userId, String(name).trim(), description || null, validStatus, color || '#c4b5fd');

  const row = db.prepare('SELECT *, 0 AS document_count FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeProject(row));
});

router.patch('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const { name, description, status, color } = req.body || {};
  const nextName = name !== undefined ? String(name).trim() : existing.name;
  const nextDescription = description !== undefined ? description : existing.description;
  const nextStatus = VALID_STATUS.includes(status) ? status : existing.status;
  const nextColor = color !== undefined ? color : existing.color;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });

  db.prepare('UPDATE projects SET name = ?, description = ?, status = ?, color = ? WHERE id = ?').run(
    nextName,
    nextDescription,
    nextStatus,
    nextColor,
    req.params.id
  );

  const row = db
    .prepare(
      `SELECT p.*, (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id) AS document_count
       FROM projects p WHERE p.id = ?`
    )
    .get(req.params.id);
  res.json(serializeProject(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ ok: true });
});

module.exports = router;
