const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendVerificationEmail({ to, username, verifyUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'ChainIt <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn(
      `[mail] RESEND_API_KEY nicht gesetzt – Verifizierungs-Link fuer ${to} wird nur geloggt:\n  ${verifyUrl}`
    );
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Bestätige deine E-Mail-Adresse für ChainIt',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#7c3aed;">ChainIt Dashboard</h2>
          <p>Hallo ${username},</p>
          <p>bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren:</p>
          <p style="margin: 24px 0;">
            <a href="${verifyUrl}" style="background:#c4b5fd;color:#201a33;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
              E-Mail bestätigen
            </a>
          </p>
          <p style="color:#888;font-size:13px;">Falls der Button nicht funktioniert, kopiere diesen Link:<br>${verifyUrl}</p>
          <p style="color:#888;font-size:13px;">Der Link ist 24 Stunden gültig.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend request failed (${res.status}): ${body}`);
  }
}

async function sendReminderEmail({ to, username, sections }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'ChainIt <onboarding@resend.dev>';
  const appUrl = process.env.APP_URL || '';

  const sectionHtml = sections
    .map(
      (s) => `
        <h3 style="color:#c4b5fd;font-size:14px;margin:18px 0 6px;">${s.title}</h3>
        <ul style="margin:0;padding-left:18px;color:#333;font-size:14px;">
          ${s.items.map((item) => `<li style="margin-bottom:4px;">${item}</li>`).join('')}
        </ul>
      `
    )
    .join('');

  if (!apiKey) {
    console.warn(`[mail] RESEND_API_KEY nicht gesetzt – Erinnerungs-Mail fuer ${to} wird nicht versendet.`);
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'ChainIt Dashboard – Tages-Update',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#7c3aed;">ChainIt Dashboard</h2>
          <p>Hallo ${username}, hier dein Update für heute:</p>
          ${sectionHtml}
          ${appUrl ? `<p style="margin-top:20px;"><a href="${appUrl}" style="background:#c4b5fd;color:#201a33;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">Zum Dashboard</a></p>` : ''}
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend request failed (${res.status}): ${body}`);
  }
}

module.exports = { sendVerificationEmail, sendReminderEmail };
