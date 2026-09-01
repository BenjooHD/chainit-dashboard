const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { sendVerificationEmail } = require('../mail');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait a few minutes and try again.',
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts created from this connection. Please try again later.',
});
const passwordCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AREAS = ['calendar', 'tasks', 'contacts', 'projects', 'mail', 'agenda', 'costs', 'invoices', 'feedback'];

function getPermissions(userId) {
  const rows = db.prepare('SELECT area, can_view, can_edit FROM permissions WHERE user_id = ?').all(userId);
  const byArea = Object.fromEntries(AREAS.map((a) => [a, { view: false, edit: false }]));
  for (const row of rows) {
    byArea[row.area] = { view: !!row.can_view, edit: !!row.can_edit };
  }
  return byArea;
}

function publicUser(row) {
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

function appUrl() {
  return process.env.APP_URL || 'http://localhost:5173';
}

async function issueVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  db.prepare('UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?').run(
    token,
    expiresAt,
    user.id
  );

  const verifyUrl = `${appUrl()}/verify-email?token=${token}`;
  await sendVerificationEmail({ to: user.email, username: user.username, verifyUrl });
}

router.post('/register', registerLimiter, async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (String(username).trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const trimmedUsername = String(username).trim();
  const trimmedEmail = String(email).trim();

  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUsername);
  if (existingUsername) {
    return res.status(409).json({ error: 'This username is already taken' });
  }
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const insert = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  );
  const result = insert.run(trimmedUsername, trimmedEmail, passwordHash);

  // Bootstrap: the very first account on a fresh install has no one to grant
  // it access, so it becomes admin automatically.
  const anyAdmin = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (!anyAdmin) {
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(result.lastInsertRowid);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  try {
    await issueVerificationEmail(user);
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return res.status(502).json({ error: 'Account created, but the verification email could not be sent. Try resending it.' });
  }

  res.status(201).json({ pendingVerification: true, email: user.email });
});

router.post('/verify-email', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token is required' });

  const user = db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token);
  if (!user) {
    return res.status(400).json({ error: 'Invalid verification link' });
  }
  // Idempotent: a second click, a page reload, or an email client's link
  // pre-fetch can replay the same token after it already succeeded once.
  if (user.email_verified) {
    return res.json({ ok: true, alreadyVerified: true });
  }
  if (new Date(user.verification_expires_at) < new Date()) {
    return res.status(400).json({ error: 'This verification link has expired. Please request a new one.' });
  }

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(user.id);

  res.json({ ok: true });
});

router.post('/resend-verification', passwordCheckLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (user.email_verified) {
    return res.status(400).json({ error: 'This account is already verified' });
  }

  try {
    await issueVerificationEmail(user);
  } catch (err) {
    console.error('Failed to resend verification email:', err);
    return res.status(502).json({ error: 'Could not send the verification email. Please try again shortly.' });
  }

  res.json({ ok: true });
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (!user.email_verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' });
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

router.patch('/me', passwordCheckLimiter, (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { currentPassword, newUsername, newPassword } = req.body || {};
  if (!currentPassword) {
    return res.status(400).json({ error: 'currentPassword is required' });
  }
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (!newUsername && !newPassword) {
    return res.status(400).json({ error: 'Provide a newUsername and/or newPassword' });
  }

  let nextUsername = user.username;
  if (newUsername) {
    const trimmed = String(newUsername).trim();
    if (trimmed.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(trimmed, user.id);
    if (existing) {
      return res.status(409).json({ error: 'This username is already taken' });
    }
    nextUsername = trimmed;
  }

  let nextPasswordHash = user.password_hash;
  if (newPassword) {
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    nextPasswordHash = bcrypt.hashSync(newPassword, 10);
  }

  db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?').run(
    nextUsername,
    nextPasswordHash,
    user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json(publicUser(updated));
});

module.exports = router;
