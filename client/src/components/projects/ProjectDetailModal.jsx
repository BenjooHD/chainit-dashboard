import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import DocumentsList from './DocumentsList';

const STATUS_LABELS = { active: 'Aktiv', done: 'Abgeschlossen', archived: 'Archiviert' };

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
        </div>
        {project.description && <p className="project-detail-description">{project.description}</p>}
        <div>
          <h4 className="documents-heading">Unterlagen</h4>
          <DocumentsList projectId={project.id} readOnly={readOnly} />
        </div>
      </div>
    </Modal>
  );
}
