import { useState } from 'react';
import MailDetailModal from './MailDetailModal';
import './Mail.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MailPanel({ messages, loading, error, notConfigured, refresh, markAllRead, toggleFlag }) {
  const [openUid, setOpenUid] = useState(null);
  const [marking, setMarking] = useState(false);

  const hasUnread = messages.some((m) => !m.seen);

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await markAllRead();
    } finally {
      setMarking(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Mail — info@chainit-technologies.com</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasUnread && (
            <button className="btn btn-secondary" onClick={handleMarkAllRead} disabled={marking}>
              {marking ? 'Markiere…' : 'Alle als gelesen markieren'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={refresh}>
            Aktualisieren
          </button>
        </div>
      </div>

      {notConfigured && (
        <div className="task-empty">
          Mail-Postfach ist noch nicht verbunden. Ein Admin muss dafür die IMAP-Zugangsdaten in Railway hinterlegen.
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && !notConfigured && !error && messages.length === 0 && (
        <div className="task-empty">Keine Nachrichten</div>
      )}

      {!loading && messages.length > 0 && (
        <ul className="mail-list">
          {messages.map((m) => (
            <li
              key={m.uid}
              className={`mail-item ${m.seen ? '' : 'mail-item-unseen'}`}
              onClick={() => setOpenUid(m.uid)}
            >
              <button
                className={`mail-item-flag ${m.flagged ? 'mail-item-flag-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFlag(m.uid, !m.flagged);
                }}
                title={m.flagged ? 'Als nicht wichtig markieren' : 'Als wichtig markieren'}
              >
                {m.flagged ? '★' : '☆'}
              </button>
              <span className="mail-item-from">{m.from}</span>
              <span className="mail-item-subject">{m.subject}</span>
              <span className="mail-item-date">{formatDate(m.date)}</span>
            </li>
          ))}
        </ul>
      )}

      {openUid && <MailDetailModal uid={openUid} onClose={() => setOpenUid(null)} />}
    </section>
  );
}
