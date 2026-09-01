import { useMailMessage } from '../../hooks/useMail';
import Modal from '../common/Modal';
import './Mail.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MailDetailModal({ uid, onClose }) {
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
