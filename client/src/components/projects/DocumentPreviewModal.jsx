import { useEffect } from 'react';

export default function DocumentPreviewModal({ doc, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fileUrl = `/api/documents/${doc.id}/file`;
  const isImage = doc.mimeType?.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="document-preview-panel">
        <div className="modal-header">
          <h3>{doc.title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">
            &times;
          </button>
        </div>
        <div className="document-preview-body">
          {isImage && <img src={fileUrl} alt={doc.title} className="document-preview-image" />}
          {isPdf && <iframe src={fileUrl} title={doc.title} className="document-preview-frame" />}
        </div>
        <div className="modal-footer">
          <a className="btn btn-secondary" href={fileUrl} download={doc.filename}>
            Herunterladen
          </a>
          <a className="btn btn-secondary" href={fileUrl} target="_blank" rel="noreferrer">
            In neuem Tab öffnen
          </a>
        </div>
      </div>
    </div>
  );
}
