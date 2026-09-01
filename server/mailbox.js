const { ImapFlow } = require('imapflow');

function isConfigured() {
  return !!(process.env.IMAP_USER && process.env.IMAP_PASSWORD);
}

function makeClient() {
  return new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.ionos.de',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASSWORD,
    },
    logger: false,
  });
}

async function withMailbox(fn) {
  if (!isConfigured()) {
    const err = new Error('Mail is not configured (IMAP_USER/IMAP_PASSWORD missing)');
    err.notConfigured = true;
    throw err;
  }
  const client = makeClient();
  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      return await fn(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

module.exports = { isConfigured, withMailbox };
