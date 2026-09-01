import { useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import './Feedback.css';

const TYPES = [
  { key: 'idee', label: 'Idee', icon: '💡' },
  { key: 'kritik', label: 'Kritik', icon: '⚠️' },
  { key: 'lob', label: 'Lob', icon: '👍' },
  { key: 'verbesserung', label: 'Verbesserung', icon: '✨' },
];

function typeInfo(key) {
  return TYPES.find((t) => t.key === key) || TYPES[0];
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tg.`;
  return new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('de-DE');
}

export default function FeedbackPanel() {
  const { user } = useAuth();
  const { posts, loading, create, remove } = useFeedback();
  const [type, setType] = useState('idee');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Bitte etwas schreiben');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await create({ type, message: message.trim() });
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Feedback</h2>
      </div>
      <p className="documents-hint">Ideen, Kritik, Lob und Verbesserungsvorschläge fürs Dashboard.</p>

      <form onSubmit={handleSubmit} className="feedback-form">
        {error && <div className="form-error">{error}</div>}
        <div className="priority-btn-group">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`priority-btn ${type === t.key ? 'priority-btn-active priority-btn-medium' : ''}`}
              onClick={() => setType(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Was denkst du über das Dashboard?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'Wird gepostet…' : 'Posten'}
        </Button>
      </form>

      <div className="feedback-filter">
        <button className={`quick-nav-item ${filter === 'all' ? 'quick-nav-item-active' : ''}`} onClick={() => setFilter('all')}>
          Alle
        </button>
        {TYPES.map((t) => (
          <button
            key={t.key}
            className={`quick-nav-item ${filter === t.key ? 'quick-nav-item-active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && filtered.length === 0 && <div className="task-empty">Noch kein Feedback</div>}

      {!loading && filtered.length > 0 && (
        <ul className="feedback-list">
          {filtered.map((p) => (
            <li key={p.id} className="feedback-item">
              <div className="feedback-item-header">
                <span className="feedback-type-badge">
                  {typeInfo(p.type).icon} {typeInfo(p.type).label}
                </span>
                <span className="feedback-item-meta">
                  {p.username} · {timeAgo(p.createdAt)}
                </span>
                {(p.isMine || user?.isAdmin) && (
                  <button className="documents-item-delete" onClick={() => setPendingDelete(p.id)} title="Löschen">
                    ✕
                  </button>
                )}
              </div>
              <div className="feedback-item-message">{p.message}</div>
            </li>
          ))}
        </ul>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Feedback löschen"
          message="Diesen Beitrag wirklich löschen?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </section>
  );
}
