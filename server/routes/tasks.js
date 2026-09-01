const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');
const { notify } = require('../notify');
const { sendCsv } = require('../csv');

const router = express.Router();

const canView = requirePermission('tasks', 'view');
const canEdit = requirePermission('tasks', 'edit');

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
    assigneeId: row.assignee_id,
    assigneeUsername: row.assignee_username || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

const TASK_SELECT = `
  SELECT t.*, p.name AS project_name, p.color AS project_color, u.username AS assignee_username
  FROM tasks t
  LEFT JOIN projects p ON p.id = t.project_id
  LEFT JOIN users u ON u.id = t.assignee_id
`;

router.get('/', canView, (req, res) => {
  const { status } = req.query;
  let sql = TASK_SELECT;
  const params = [];
  if (status) {
    sql += ' WHERE t.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeTask));
});

router.get('/projects', canView, (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY name ASC').all();
  res.json(rows.map((r) => ({ id: r.id, name: r.name, color: r.color })));
});

router.post('/projects', canEdit, (req, res) => {
  const { name, color } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db
    .prepare('INSERT INTO projects (user_id, name, color) VALUES (?, ?, ?)')
    .run(req.session.userId, name, color || '#c4b5fd');
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ id: row.id, name: row.name, color: row.color });
});

router.get('/assignees', canView, (req, res) => {
  const rows = db.prepare('SELECT id, username FROM users ORDER BY username COLLATE NOCASE ASC').all();
  res.json(rows);
});

router.get('/export.csv', canView, (req, res) => {
  const rows = db.prepare(`${TASK_SELECT} ORDER BY t.created_at DESC`).all();
  sendCsv(
    res,
    'aufgaben.csv',
    ['Titel', 'Beschreibung', 'Status', 'Fällig am', 'Projekt', 'Zugewiesen an', 'Erstellt am'],
    rows.map((r) => [
      r.title,
      r.description,
      r.status,
      r.due_date,
      r.project_name,
      r.assignee_username,
      r.created_at,
    ])
  );
});

router.post('/', canEdit, (req, res) => {
  const { title, description, projectId, status, dueDate, assigneeId } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });

  const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : 'todo';
  const completedAt = validStatus === 'done' ? new Date().toISOString() : null;

  const result = db
    .prepare(
      `INSERT INTO tasks (user_id, project_id, assignee_id, title, description, status, due_date, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.session.userId,
      projectId || null,
      assigneeId || null,
      title,
      description || null,
      validStatus,
      dueDate || null,
      completedAt
    );

  const row = db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(result.lastInsertRowid);
  if (assigneeId && Number(assigneeId) !== req.session.userId) {
    notify(assigneeId, 'task_assigned', `Dir wurde die Aufgabe "${row.title}" zugewiesen`, 'tasks');
  }
  res.status(201).json(serializeTask(row));
});

router.patch('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { title, description, projectId, status, dueDate, assigneeId } = req.body || {};

  const nextTitle = title !== undefined ? title : existing.title;
  const nextDescription = description !== undefined ? description : existing.description;
  const nextProjectId = projectId !== undefined ? projectId : existing.project_id;
  const nextDueDate = dueDate !== undefined ? dueDate : existing.due_date;
  const nextAssigneeId = assigneeId !== undefined ? assigneeId : existing.assignee_id;
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
    `UPDATE tasks SET title = ?, description = ?, project_id = ?, assignee_id = ?, status = ?, due_date = ?,
     completed_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    nextTitle,
    nextDescription,
    nextProjectId,
    nextAssigneeId || null,
    nextStatus,
    nextDueDate,
    nextCompletedAt,
    req.params.id
  );

  const row = db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(req.params.id);
  if (
    nextAssigneeId &&
    Number(nextAssigneeId) !== existing.assignee_id &&
    Number(nextAssigneeId) !== req.session.userId
  ) {
    notify(nextAssigneeId, 'task_assigned', `Dir wurde die Aufgabe "${row.title}" zugewiesen`, 'tasks');
  }
  res.json(serializeTask(row));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

module.exports = router;
