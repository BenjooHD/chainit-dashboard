import { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import ProjectFormModal from './ProjectFormModal';
import ProjectDetailModal from './ProjectDetailModal';
import './Projects.css';

const STATUS_LABELS = { active: 'Aktiv', done: 'Abgeschlossen', archived: 'Archiviert' };
const PRIORITY_LABELS = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function todayDateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ProjectsPanel({ readOnly = false }) {
  const { projects, owners, loading, create, update, remove } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const todayStr = todayDateStr();

  const handleSave = async (payload) => {
    if (editingProject) {
      await update(editingProject.id, payload);
    } else {
      await create(payload);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Projekte</h2>
        {!readOnly && <Button onClick={() => setShowCreate(true)}>+ Projekt</Button>}
      </div>

      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && projects.length === 0 && <div className="task-empty">Noch keine Projekte</div>}

      <div className="project-grid">
        {projects.map((p) => (
          <button key={p.id} className="project-card" onClick={() => setViewingProject(p)}>
            <span className="project-card-color" style={{ background: p.color }} />
            <div className="project-card-body">
              <div className="project-card-name">
                {p.name}
                <span className={`project-priority-badge project-priority-badge-${p.priority}`}>
                  {PRIORITY_LABELS[p.priority] || p.priority}
                </span>
              </div>
              <div className="project-card-meta">
                {STATUS_LABELS[p.status] || p.status} · {p.documentCount} Unterlage
                {p.documentCount === 1 ? '' : 'n'}
              </div>
              {p.ownerName && <div className="project-card-owner">Ansprechpartner: {p.ownerName}</div>}
              {p.deadline && (
                <div
                  className={`project-card-deadline ${
                    p.status === 'active' && p.deadline < todayStr ? 'project-card-deadline-overdue' : ''
                  }`}
                >
                  Deadline: {formatDeadline(p.deadline)}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {(showCreate || editingProject) && (
        <ProjectFormModal
          project={editingProject}
          owners={owners}
          onClose={() => {
            setShowCreate(false);
            setEditingProject(null);
          }}
          onSave={handleSave}
          onDelete={(id) => {
            setPendingDelete(id);
            setEditingProject(null);
          }}
        />
      )}

      {viewingProject && !editingProject && (
        <ProjectDetailModal
          project={viewingProject}
          readOnly={readOnly}
          onClose={() => setViewingProject(null)}
          onEdit={(p) => {
            setViewingProject(null);
            setEditingProject(p);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Projekt löschen"
          message="Dieses Projekt wirklich löschen? Zugehörige Aufgaben und Unterlagen bleiben erhalten, verlieren aber die Zuordnung."
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
