import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const STATUSES = [
  { value: 'active', label: 'Aktiv' },
  { value: 'done', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
];

export default function ProjectFormModal({ project, onClose, onSave, onDelete }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [color, setColor] = useState(project?.color || '#c4b5fd');
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
      await onSave({ name: name.trim(), description: description.trim() || null, status, color });
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
          Farbe
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 40 }} />
        </label>
      </form>
    </Modal>
  );
}
