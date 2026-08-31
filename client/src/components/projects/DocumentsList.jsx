import { useRef, useState } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import ConfirmDialog from '../common/ConfirmDialog';
import Button from '../common/Button';
import './Projects.css';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsList({ projectId, readOnly }) {
  const { documents, loading, error, upload, remove } = useDocuments(projectId ?? 'none');
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await upload({ file, title: file.name, projectId });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="documents-list">
      {!readOnly && (
        <div className="documents-upload">
          <input
            ref={fileInputRef}
            type="file"
            id={`file-input-${projectId || 'general'}`}
            className="documents-file-input"
            onChange={handleFileChosen}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Lädt hoch…' : '+ Datei hochladen'}
          </Button>
          <span className="documents-upload-hint">max. 20 MB</span>
        </div>
      )}
      {uploadError && <div className="form-error">{uploadError}</div>}
      {error && <div className="form-error">{error}</div>}
      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && documents.length === 0 && <div className="task-empty">Noch keine Unterlagen</div>}
      {!loading && documents.length > 0 && (
        <ul className="documents-items">
          {documents.map((d) => (
            <li key={d.id} className="documents-item">
              <a
                href={`/api/documents/${d.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="documents-item-link"
              >
                📄 {d.title}
              </a>
              <span className="documents-item-meta">{formatSize(d.sizeBytes)}</span>
              {!readOnly && (
                <button className="documents-item-delete" onClick={() => setPendingDelete(d.id)} title="Löschen">
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Unterlage löschen"
          message="Diese Datei wirklich löschen?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
