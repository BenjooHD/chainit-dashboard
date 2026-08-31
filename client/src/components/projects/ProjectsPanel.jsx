import { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import ProjectFormModal from './ProjectFormModal';
import ProjectDetailModal from './ProjectDetailModal';
import DocumentsList from './DocumentsList';
import './Projects.css';

const STATUS_LABELS = { active: 'Aktiv', done: 'Abgeschlossen', archived: 'Archiviert' };

export default function ProjectsPanel({ readOnly = false }) {
  const { projects, loading, create, update, remove } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

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
              <div className="project-card-name">{p.name}</div>
              <div className="project-card-meta">
                {STATUS_LABELS[p.status] || p.status} · {p.documentCount} Unterlage
                {p.documentCount === 1 ? '' : 'n'}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="project-general-docs">
        <h3 className="documents-heading">Allgemeine Unterlagen</h3>
        <p className="documents-hint">Nicht an ein bestimmtes Projekt gebunden.</p>
        <DocumentsList projectId={null} readOnly={readOnly} />
      </div>

      {(showCreate || editingProject) && (
        <ProjectFormModal
          project={editingProject}
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
