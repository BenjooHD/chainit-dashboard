import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function TaskFormModal({ task, projects, onClose, onSave, onDelete, onCreateProject }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [newProjectName, setNewProjectName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Titel ist erforderlich');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let finalProjectId = projectId || null;
      if (newProjectName.trim()) {
        const created = await onCreateProject({ name: newProjectName.trim() });
        finalProjectId = created.id;
      }
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        status,
        projectId: finalProjectId,
        dueDate: dueDate || null,
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
      title={task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      onClose={onClose}
      footer={
        <>
          {task ? (
            <Button variant="danger" type="button" onClick={() => onDelete(task.id)}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="task-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Titel
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label>
          Beschreibung
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Arbeit</option>
            <option value="done">Erledigt</option>
          </select>
        </label>
        <label>
          Fällig am
          <input type="date" value={dueDate || ''} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label>
          Projekt
          <select value={projectId || ''} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Kein Projekt</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Neues Projekt anlegen (optional)
          <input
            placeholder="Projektname"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
}
