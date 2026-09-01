const express = require('express');
const db = require('../db/connection');

const router = express.Router();

function getPermissions(userId, isAdmin) {
  if (isAdmin) {
    return { calendar: true, tasks: true, contacts: true, projects: true, mail: true, agenda: true, costs: true };
  }
  const rows = db.prepare('SELECT area, can_view FROM permissions WHERE user_id = ?').all(userId);
  const perms = { calendar: false, tasks: false, contacts: false, projects: false, mail: false, agenda: false, costs: false };
  for (const row of rows) perms[row.area] = !!row.can_view;
  return perms;
}

router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ tasks: [], contacts: [], projects: [], documents: [], agenda: [], costs: [] });

  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const perms = getPermissions(req.session.userId, !!user.is_admin);

  const like = `%${q}%`;
  const result = { tasks: [], contacts: [], projects: [], documents: [], agenda: [], costs: [] };

  if (perms.tasks) {
    result.tasks = db
      .prepare('SELECT id, title, status FROM tasks WHERE title LIKE ? OR description LIKE ? LIMIT 8')
      .all(like, like)
      .map((r) => ({ id: r.id, title: r.title, status: r.status }));
  }
  if (perms.contacts) {
    result.contacts = db
      .prepare('SELECT id, full_name, company FROM contacts WHERE full_name LIKE ? OR company LIKE ? OR email LIKE ? LIMIT 8')
      .all(like, like, like)
      .map((r) => ({ id: r.id, title: r.full_name, subtitle: r.company }));
  }
  if (perms.projects) {
    result.projects = db
      .prepare('SELECT id, name, status FROM projects WHERE name LIKE ? OR description LIKE ? LIMIT 8')
      .all(like, like)
      .map((r) => ({ id: r.id, title: r.name, status: r.status }));
    const files = db
      .prepare('SELECT id, title, project_id FROM documents WHERE title LIKE ? LIMIT 8')
      .all(like)
      .map((r) => ({ id: r.id, title: r.title, projectId: r.project_id }));
    const links = db
      .prepare('SELECT id, title, project_id FROM document_links WHERE title LIKE ? LIMIT 8')
      .all(like)
      .map((r) => ({ id: r.id, title: r.title, projectId: r.project_id, subtitle: 'Google Drive' }));
    result.documents = [...files, ...links];
  }
  if (perms.agenda) {
    result.agenda = db
      .prepare('SELECT id, title FROM agenda_items WHERE title LIKE ? OR notes LIKE ? LIMIT 8')
      .all(like, like)
      .map((r) => ({ id: r.id, title: r.title }));
  }
  if (perms.costs) {
    result.costs = db
      .prepare('SELECT id, title, amount FROM costs WHERE title LIKE ? OR category LIKE ? LIMIT 8')
      .all(like, like)
      .map((r) => ({ id: r.id, title: r.title, subtitle: `${r.amount.toFixed(2)} €` }));
  }

  res.json(result);
});

module.exports = router;
