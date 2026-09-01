import DocumentsList from './DocumentsList';
import './Projects.css';

export default function GeneralDocumentsPanel({ readOnly = false }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Unterlagen</h2>
      </div>
      <p className="documents-hint">Nicht an ein bestimmtes Projekt gebunden. Dateien pro Projekt findest du im jeweiligen Projekt.</p>
      <DocumentsList projectId={null} readOnly={readOnly} />
    </section>
  );
}
