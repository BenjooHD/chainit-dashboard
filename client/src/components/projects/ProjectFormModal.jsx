import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const STATUSES = [
  { value: 'active', label: 'Aktiv' },
  { value: 'done', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
];

const PRIORITIES = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
];

const COLOR_PRESETS = ['#c4b5fd', '#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#f472b6'];

export default function ProjectFormModal({ project, owners, onClose, onSave, onDelete }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [priority, setPriority] = useState(project?.priority || 'medium');
  const [color, setColor] = useState(project?.color || '#c4b5fd');
  const [ownerId, setOwnerId] = useState(project?.ownerId || '');
  const [deadline, setDeadline] = useState(project?.deadline || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name ist erforderlich');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        status,
        priority,
        color,
        ownerId: ownerId || null,
        deadline: deadline || null,
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
      title={project ? 'Projekt bearbeiten' : 'Neues Projekt'}
      onClose={onClose}
      footer={
        <>
          {project ? (
            <Button variant="danger" type="button" onClick={() => onDelete(project.id)}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="project-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label>
          Beschreibung
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
          Deadline
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        <label>
          Projektleitung / Ansprechpartner
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Keine Zuordnung</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.username}
              </option>
            ))}
          </select>
        </label>
        <label>
          Farbe
          <div className="project-color-presets">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`project-color-swatch ${color === c ? 'project-color-swatch-active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Farbe ${c}`}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="project-color-custom"
              title="Eigene Farbe"
            />
          </div>
        </label>
      </form>
    </Modal>
  );
}
