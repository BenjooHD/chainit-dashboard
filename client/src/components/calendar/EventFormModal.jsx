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

export default function EventFormModal({ event, defaultDate, onClose, onSave, onDelete, onDeleteSeries }) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [priority, setPriority] = useState(event?.priority || 'medium');
  const [startAt, setStartAt] = useState(
    event ? toLocalInput(event.startAt) : `${defaultDate}T09:00`
  );
  const [endAt, setEndAt] = useState(event ? toLocalInput(event.endAt) : `${defaultDate}T10:00`);
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleStartChange = (value) => {
    setStartAt(value);
    if (value) {
      const start = new Date(value);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      setEndAt(
        `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`
      );
    }
  };

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
        ...(!event && recurrence !== 'none' ? { recurrence, recurrenceCount } : {}),
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
            <span style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="danger" type="button" onClick={() => onDelete(event.id)}>
                Löschen
              </Button>
              {event.recurrenceGroup && (
                <Button variant="danger" type="button" onClick={() => onDeleteSeries(event.id)}>
                  Serie löschen
                </Button>
              )}
            </span>
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
          <input type="datetime-local" value={startAt} onChange={(e) => handleStartChange(e.target.value)} />
        </label>
        <label>
          Ende
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </label>
        {!event && (
          <>
            <label>
              Wiederholung
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <option value="none">Keine</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </label>
            {recurrence !== 'none' && (
              <label>
                Anzahl Wiederholungen
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(e.target.value)}
                />
              </label>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}
