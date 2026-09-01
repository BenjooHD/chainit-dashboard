const express = require('express');
const { simpleParser } = require('mailparser');
const requirePermission = require('../middleware/requirePermission');
const { withMailbox, isConfigured } = require('../mailbox');

const router = express.Router();
const canView = requirePermission('mail', 'view');

function formatAddress(envelopeAddr) {
  if (!envelopeAddr || envelopeAddr.length === 0) return null;
  const a = envelopeAddr[0];
  return a.name ? `${a.name} <${a.address}>` : a.address;
}

router.get('/status', canView, (req, res) => {
  res.json({ configured: isConfigured() });
});

router.get('/', canView, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Mail is not configured yet', code: 'MAIL_NOT_CONFIGURED' });
  }
  try {
    const messages = await withMailbox(async (client) => {
      const status = await client.status('INBOX', { messages: true });
      const total = status.messages || 0;
      if (total === 0) return [];
      const start = Math.max(1, total - 29);
      const out = [];
      for await (const msg of client.fetch(`${start}:*`, { envelope: true, flags: true, uid: true })) {
        out.push({
          uid: msg.uid,
          from: formatAddress(msg.envelope?.from),
          subject: msg.envelope?.subject || '(kein Betreff)',
          date: msg.envelope?.date || null,
          seen: msg.flags?.has('\\Seen') || false,
          flagged: msg.flags?.has('\\Flagged') || false,
        });
      }
      out.sort((a, b) => {
        const aTop = !a.seen || a.flagged ? 1 : 0;
        const bTop = !b.seen || b.flagged ? 1 : 0;
        if (aTop !== bTop) return bTop - aTop;
        return new Date(b.date) - new Date(a.date);
      });
      return out;
    });
    res.json(messages);
  } catch (err) {
    console.error('IMAP fetch failed:', err);
    res.status(502).json({ error: 'Could not reach the mailbox. Please try again shortly.' });
  }
});

router.patch('/mark-all-read', canView, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Mail is not configured yet', code: 'MAIL_NOT_CONFIGURED' });
  }
  try {
    await withMailbox(async (client) => {
      const status = await client.status('INBOX', { messages: true });
      if ((status.messages || 0) > 0) {
        await client.messageFlagsAdd('1:*', ['\\Seen']);
      }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('IMAP mark-all-read failed:', err);
    res.status(502).json({ error: 'Could not reach the mailbox. Please try again shortly.' });
  }
});

router.patch('/:uid/flag', canView, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Mail is not configured yet', code: 'MAIL_NOT_CONFIGURED' });
  }
  const uid = Number(req.params.uid);
  const flagged = !!(req.body && req.body.flagged);
  try {
    await withMailbox(async (client) => {
      if (flagged) {
        await client.messageFlagsAdd(String(uid), ['\\Flagged'], { uid: true });
      } else {
        await client.messageFlagsRemove(String(uid), ['\\Flagged'], { uid: true });
      }
    });
    res.json({ ok: true, flagged });
  } catch (err) {
    console.error('IMAP flag update failed:', err);
    res.status(502).json({ error: 'Could not update this message.' });
  }
});

router.get('/:uid', canView, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Mail is not configured yet', code: 'MAIL_NOT_CONFIGURED' });
  }
  const uid = Number(req.params.uid);
  try {
    const parsed = await withMailbox(async (client) => {
      const { content } = await client.download(String(uid), undefined, { uid: true });
      const chunks = [];
      for await (const chunk of content) chunks.push(chunk);
      return simpleParser(Buffer.concat(chunks));
    });
    res.json({
      uid,
      from: parsed.from?.text || null,
      to: parsed.to?.text || null,
      subject: parsed.subject || '(kein Betreff)',
      date: parsed.date || null,
      text: parsed.text || null,
      html: parsed.html || null,
    });
  } catch (err) {
    console.error('IMAP message fetch failed:', err);
    res.status(502).json({ error: 'Could not load this message.' });
  }
});

module.exports = router;
