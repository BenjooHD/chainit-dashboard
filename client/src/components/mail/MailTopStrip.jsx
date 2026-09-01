import { useState } from 'react';
import MailDetailModal from './MailDetailModal';
import './MailTopStrip.css';

function truncate(text, max) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MailTopStrip({ messages, loading, notConfigured, error }) {
  const [openUid, setOpenUid] = useState(null);

  if (loading || notConfigured || error) return null;
  if (messages.length === 0) return null;

  return (
    <div className="mail-top-strip">
      {messages.map((m) => (
        <button
          key={m.uid}
          className={`mail-top-card ${m.seen ? '' : 'mail-top-card-unseen'}`}
          onClick={() => setOpenUid(m.uid)}
        >
          <span className="mail-top-from">{truncate(m.from, 26)}</span>
          <span className="mail-top-subject">
            {m.flagged && <span className="mail-top-flag">★ </span>}
            {truncate(m.subject, 46)}
          </span>
          <span className="mail-top-date">{formatDate(m.date)}</span>
        </button>
      ))}

      {openUid && <MailDetailModal uid={openUid} onClose={() => setOpenUid(null)} />}
    </div>
  );
}
