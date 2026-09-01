import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import DocumentsList from './DocumentsList';

const STATUS_LABELS = { active: 'Aktiv', done: 'Abgeschlossen', archived: 'Archiviert' };
const PRIORITY_LABELS = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export default function ProjectDetailModal({ project, onClose, onEdit, readOnly }) {
  return (
    <Modal
      title={project.name}
      onClose={onClose}
      footer={
        !readOnly && (
          <>
            <span />
            <Button type="button" onClick={() => onEdit(project)}>
              Bearbeiten
            </Button>
          </>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div className="project-detail-status">
          <span className="project-status-badge" style={{ background: project.color }}>
            {STATUS_LABELS[project.status] || project.status}
          </span>
          <span className={`project-priority-badge project-priority-badge-${project.priority}`}>
            {PRIORITY_LABELS[project.priority] || project.priority}
          </span>
        </div>
        {project.ownerName && (
          <div className="project-detail-owner">Projektleitung / Ansprechpartner: {project.ownerName}</div>
        )}
        {project.deadline && (
          <div className="project-detail-deadline">Deadline: {formatDeadline(project.deadline)}</div>
        )}
        {project.description && <p className="project-detail-description">{project.description}</p>}
        <div>
          <h4 className="documents-heading">Unterlagen</h4>
          <DocumentsList projectId={project.id} readOnly={readOnly} />
        </div>
      </div>
    </Modal>
  );
}
