const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { sendVerificationEmail } = require('../mail');

const router = express.Router();

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailVerified: !!row.email_verified,
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

router.post('/register', async (req, res) => {
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

router.post('/resend-verification', async (req, res) => {
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

router.post('/login', (req, res) => {
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

module.exports = router;
