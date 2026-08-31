const express = require('express');
const db = require('../db/connection');

const router = express.Router();

function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    projectId: row.project_id,
    projectName: row.project_name || null,
    projectColor: row.project_color || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT t.*, p.name AS project_name, p.color AS project_color
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = ?
  `;
  const params = [req.session.userId];
  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeTask));
});

router.get('/projects', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY name ASC')
    .all(req.session.userId);
  res.json(rows.map((r) => ({ id: r.id, name: r.name, color: r.color })));
});

router.post('/projects', (req, res) => {
  const { name, color } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db
    .prepare('INSERT INTO projects (user_id, name, color) VALUES (?, ?, ?)')
    .run(req.session.userId, name, color || '#c4b5fd');
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ id: row.id, name: row.name, color: row.color });
});

router.post('/', (req, res) => {
  const { title, description, projectId, status, dueDate } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });

  const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : 'todo';
  const completedAt = validStatus === 'done' ? new Date().toISOString() : null;

  const result = db
    .prepare(
      `INSERT INTO tasks (user_id, project_id, title, description, status, due_date, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.session.userId, projectId || null, title, description || null, validStatus, dueDate || null, completedAt);

  const row = db
    .prepare(
      `SELECT t.*, p.name AS project_name, p.color AS project_color
       FROM tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(serializeTask(row));
});

router.patch('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { title, description, projectId, status, dueDate } = req.body || {};

  const nextTitle = title !== undefined ? title : existing.title;
  const nextDescription = description !== undefined ? description : existing.description;
  const nextProjectId = projectId !== undefined ? projectId : existing.project_id;
  const nextDueDate = dueDate !== undefined ? dueDate : existing.due_date;
  let nextStatus = existing.status;
  let nextCompletedAt = existing.completed_at;

  if (status !== undefined && ['todo', 'in_progress', 'done'].includes(status)) {
    nextStatus = status;
    if (status === 'done' && existing.status !== 'done') {
      nextCompletedAt = new Date().toISOString();
    } else if (status !== 'done') {
      nextCompletedAt = null;
    }
  }

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, project_id = ?, status = ?, due_date = ?,
     completed_at = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`
  ).run(nextTitle, nextDescription, nextProjectId, nextStatus, nextDueDate, nextCompletedAt, req.params.id, req.session.userId);

  const row = db
    .prepare(
      `SELECT t.*, p.name AS project_name, p.color AS project_color
       FROM tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.id = ?`
    )
    .get(req.params.id);
  res.json(serializeTask(row));
});

router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

module.exports = router;
