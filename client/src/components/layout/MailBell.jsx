import { useRef, useState } from 'react';
import MailDetailModal from '../mail/MailDetailModal';
import { useClickOutside } from '../../hooks/useClickOutside';

function truncate(text, max) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MailBell({ messages, notConfigured }) {
  const [open, setOpen] = useState(false);
  const [openUid, setOpenUid] = useState(null);
  const containerRef = useRef(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  const rest = messages.slice(3);
  const unreadRest = rest.filter((m) => !m.seen).length;

  return (
    <div className="header-notif" ref={containerRef}>
      <button className="header-notif-trigger" onClick={() => setOpen((o) => !o)} title="Weitere Mails">
        ✉️
        {unreadRest > 0 && <span className="header-notif-badge">{unreadRest}</span>}
      </button>
      {open && (
        <div className="header-notif-panel">
          {notConfigured && <div className="task-empty">Mail-Postfach ist nicht verbunden.</div>}
          {!notConfigured && rest.length === 0 && <div className="task-empty">Keine weiteren Mails</div>}
          {rest.map((m) => (
            <div
              key={m.uid}
              className={`header-notif-item ${!m.seen ? 'header-notif-item-unseen' : ''}`}
              onClick={() => {
                setOpenUid(m.uid);
                setOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div>
                {m.flagged && <span style={{ color: '#facc15' }}>★ </span>}
                {truncate(m.subject, 40)}
              </div>
              <div className="header-notif-time">
                {truncate(m.from, 30)} · {formatDate(m.date)}
              </div>
            </div>
          ))}
        </div>
      )}

      {openUid && <MailDetailModal uid={openUid} onClose={() => setOpenUid(null)} />}
    </div>
  );
}
