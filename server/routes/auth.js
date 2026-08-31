const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');

const router = express.Router();

function publicUser(row) {
  return { id: row.id, username: row.username, createdAt: row.created_at };
}

router.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (String(username).trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const trimmedUsername = String(username).trim();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUsername);
  if (existing) {
    return res.status(409).json({ error: 'This username is already taken' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const result = insert.run(trimmedUsername, passwordHash);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  req.session.userId = user.id;
  res.status(201).json(publicUser(user));
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.userId = user.id;
  res.json(publicUser(user));
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(publicUser(user));
});

module.exports = router;
