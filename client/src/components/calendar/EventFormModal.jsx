import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PRIORITIES = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
];

export default function EventFormModal({ event, defaultDate, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [priority, setPriority] = useState(event?.priority || 'medium');
  const [startAt, setStartAt] = useState(
    event ? toLocalInput(event.startAt) : `${defaultDate}T09:00`
  );
  const [endAt, setEndAt] = useState(event ? toLocalInput(event.endAt) : `${defaultDate}T10:00`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startAt || !endAt) {
      setError('Titel, Start und Ende sind erforderlich');
      return;
    }
    if (new Date(endAt) < new Date(startAt)) {
      setError('Ende darf nicht vor dem Start liegen');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        priority,
        startAt,
        endAt,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={event ? 'Termin bearbeiten' : 'Neuer Termin'}
      onClose={onClose}
      footer={
        <>
          {event ? (
            <Button variant="danger" type="button" onClick={() => onDelete(event.id)}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="event-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Titel
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label>
          Beschreibung
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Ort
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label>
          Priorität
          <div className="priority-btn-group">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`priority-btn priority-btn-${p.value} ${priority === p.value ? 'priority-btn-active' : ''}`}
                onClick={() => setPriority(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </label>
        <label>
          Start
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </label>
        <label>
          Ende
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
