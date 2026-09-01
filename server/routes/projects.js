const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

const canView = requirePermission('projects', 'view');
const canEdit = requirePermission('projects', 'edit');
const VALID_STATUS = ['active', 'done', 'archived'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

const PROJECT_SELECT = `
  SELECT p.*, u.username AS owner_username,
    (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id) AS document_count
  FROM projects p
  LEFT JOIN users u ON u.id = p.owner_id
`;

function serializeProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    color: row.color,
    ownerId: row.owner_id,
    ownerName: row.owner_username || null,
    deadline: row.deadline,
    createdAt: row.created_at,
    documentCount: row.document_count || 0,
  };
}

router.get('/', canView, (req, res) => {
  const rows = db.prepare(`${PROJECT_SELECT} ORDER BY p.created_at DESC`).all();
  res.json(rows.map(serializeProject));
});

router.get('/owners', canView, (req, res) => {
  const rows = db.prepare('SELECT id, username FROM users ORDER BY username COLLATE NOCASE ASC').all();
  res.json(rows);
});

router.post('/', canEdit, (req, res) => {
  const { name, description, status, priority, color, ownerId, deadline } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required' });
  const validStatus = VALID_STATUS.includes(status) ? status : 'active';
  const validPriority = VALID_PRIORITY.includes(priority) ? priority : 'medium';

  const result = db
    .prepare(
      'INSERT INTO projects (user_id, name, description, status, priority, color, owner_id, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      req.session.userId,
      String(name).trim(),
      description || null,
      validStatus,
      validPriority,
      color || '#c4b5fd',
      ownerId || null,
      deadline || null
    );

  const row = db.prepare(`${PROJECT_SELECT} WHERE p.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(serializeProject(row));
});

router.patch('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const { name, description, status, priority, color, ownerId, deadline } = req.body || {};
  const nextName = name !== undefined ? String(name).trim() : existing.name;
  const nextDescription = description !== undefined ? description : existing.description;
  const nextStatus = VALID_STATUS.includes(status) ? status : existing.status;
  const nextPriority = VALID_PRIORITY.includes(priority) ? priority : existing.priority;
  const nextColor = color !== undefined ? color : existing.color;
  const nextOwnerId = ownerId !== undefined ? ownerId || null : existing.owner_id;
  const nextDeadline = deadline !== undefined ? deadline || null : existing.deadline;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });

  db.prepare(
    'UPDATE projects SET name = ?, description = ?, status = ?, priority = ?, color = ?, owner_id = ?, deadline = ? WHERE id = ?'
  ).run(nextName, nextDescription, nextStatus, nextPriority, nextColor, nextOwnerId, nextDeadline, req.params.id);

  const row = db.prepare(`${PROJECT_SELECT} WHERE p.id = ?`).get(req.params.id);
  res.json(serializeProject(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ ok: true });
});

module.exports = router;
