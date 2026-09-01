import { useState } from 'react';
import { useMailList, useMailMessage } from '../../hooks/useMail';
import Modal from '../common/Modal';
import './Mail.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function MailDetailModal({ uid, onClose }) {
  const { message, loading, error } = useMailMessage(uid);
  return (
    <Modal title={message?.subject || 'Nachricht'} onClose={onClose}>
      {loading && <div className="task-empty">Lädt…</div>}
      {error && <div className="form-error">{error}</div>}
      {message && (
        <div className="mail-detail">
          <div className="mail-detail-meta">
            <div>
              <strong>Von:</strong> {message.from}
            </div>
            <div>
              <strong>An:</strong> {message.to}
            </div>
            <div>
              <strong>Datum:</strong> {formatDate(message.date)}
            </div>
          </div>
          <div className="mail-detail-body">{message.text || '(kein Textinhalt)'}</div>
        </div>
      )}
    </Modal>
  );
}

function truncate(text, max = 60) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function MailPanel() {
  const { messages, loading, error, notConfigured, refresh } = useMailList();
  const [openUid, setOpenUid] = useState(null);

  const latestThree = messages.slice(0, 3);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Mail — info@chainit-technologies.com</h2>
        <button className="btn btn-secondary" onClick={refresh}>
          Aktualisieren
        </button>
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

      {!loading && latestThree.length > 0 && (
        <div className="mail-latest">
          {latestThree.map((m) => (
            <div
              key={m.uid}
              className={`mail-latest-card ${m.seen ? '' : 'mail-latest-card-unseen'}`}
              onClick={() => setOpenUid(m.uid)}
            >
              <div className="mail-latest-from">{truncate(m.from, 28)}</div>
              <div className="mail-latest-subject">{truncate(m.subject, 50)}</div>
              <div className="mail-latest-date">{formatDate(m.date)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && messages.length > 0 && (
        <ul className="mail-list">
          {messages.map((m) => (
            <li
              key={m.uid}
              className={`mail-item ${m.seen ? '' : 'mail-item-unseen'}`}
              onClick={() => setOpenUid(m.uid)}
            >
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
