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

module.exports = { sendVerificationEmail };
