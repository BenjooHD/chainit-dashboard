const express = require('express');
const db = require('../db/connection');

const router = express.Router();
const AREAS = ['calendar', 'tasks', 'contacts', 'projects', 'mail', 'agenda', 'costs', 'invoices'];

function getPermissions(userId) {
  const rows = db.prepare('SELECT area, can_view, can_edit FROM permissions WHERE user_id = ?').all(userId);
  const byArea = Object.fromEntries(AREAS.map((a) => [a, { view: false, edit: false }]));
  for (const row of rows) {
    byArea[row.area] = { view: !!row.can_view, edit: !!row.can_edit };
  }
  return byArea;
}

function serializeUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailVerified: !!row.email_verified,
    isAdmin: !!row.is_admin,
    title: row.title || null,
    permissions: row.is_admin
      ? Object.fromEntries(AREAS.map((a) => [a, { view: true, edit: true }]))
      : getPermissions(row.id),
    createdAt: row.created_at,
  };
}

router.get('/users', (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();
  res.json(rows.map(serializeUser));
});

router.patch('/users/:id', (req, res) => {
  const targetId = Number(req.params.id);
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { title, isAdmin, permissions } = req.body || {};

  if (isAdmin === false && target.is_admin) {
    const adminCount = db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_admin = 1').get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'At least one admin must remain' });
    }
  }

  if (title !== undefined) {
    db.prepare('UPDATE users SET title = ? WHERE id = ?').run(title ? String(title).trim() : null, targetId);
  }
  if (isAdmin !== undefined) {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, targetId);
  }

  if (permissions && typeof permissions === 'object') {
    const upsert = db.prepare(
      `INSERT INTO permissions (user_id, area, can_view, can_edit) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, area) DO UPDATE SET can_view = excluded.can_view, can_edit = excluded.can_edit`
    );
    for (const area of AREAS) {
      if (!permissions[area]) continue;
      const view = !!permissions[area].view;
      // Edit implies view — can't grant edit without also granting view.
      const edit = !!permissions[area].edit;
      upsert.run(targetId, area, (view || edit) ? 1 : 0, edit ? 1 : 0);
    }
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  res.json(serializeUser(updated));
});

module.exports = router;
