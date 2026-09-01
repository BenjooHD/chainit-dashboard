import { useRef, useState } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import ConfirmDialog from '../common/ConfirmDialog';
import Button from '../common/Button';
import DocumentPreviewModal from './DocumentPreviewModal';
import './Projects.css';

function isPreviewable(mimeType) {
  return mimeType?.startsWith('image/') || mimeType === 'application/pdf';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsList({ projectId, readOnly }) {
  const { documents, loading, error, upload, addLink, remove } = useDocuments(projectId ?? 'none');
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState(null);
  const [savingLink, setSavingLink] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

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

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError('Titel und Link sind erforderlich');
      return;
    }
    setSavingLink(true);
    setLinkError(null);
    try {
      await addLink({ title: linkTitle.trim(), url: linkUrl.trim(), projectId });
      setLinkTitle('');
      setLinkUrl('');
      setShowLinkForm(false);
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setSavingLink(false);
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
          <Button type="button" variant="secondary" onClick={() => setShowLinkForm((v) => !v)}>
            + Google-Drive-Link
          </Button>
          <span className="documents-upload-hint">max. 20 MB</span>
        </div>
      )}

      {showLinkForm && (
        <form className="documents-link-form" onSubmit={handleAddLink}>
          {linkError && <div className="form-error">{linkError}</div>}
          <input
            placeholder="Titel (z.B. Angebot Kunde X)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
          />
          <input
            placeholder="https://drive.google.com/..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <Button type="submit" disabled={savingLink}>
            {savingLink ? 'Speichern…' : 'Hinzufügen'}
          </Button>
        </form>
      )}

      {uploadError && <div className="form-error">{uploadError}</div>}
      {error && <div className="form-error">{error}</div>}
      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && documents.length === 0 && <div className="task-empty">Noch keine Unterlagen</div>}
      {!loading && documents.length > 0 && (
        <ul className="documents-items">
          {documents.map((d) =>
            d.kind === 'link' ? (
              <li key={`link-${d.id}`} className="documents-item">
                <a href={d.url} target="_blank" rel="noreferrer" className="documents-item-link">
                  🔗 {d.title}
                </a>
                <span className="documents-item-meta">Google Drive</span>
                {!readOnly && (
                  <button className="documents-item-delete" onClick={() => setPendingDelete(d)} title="Löschen">
                    ✕
                  </button>
                )}
              </li>
            ) : (
              <li key={`file-${d.id}`} className="documents-item">
                {isPreviewable(d.mimeType) ? (
                  <button className="documents-item-link documents-item-link-btn" onClick={() => setPreviewDoc(d)}>
                    {d.mimeType.startsWith('image/') ? '🖼️' : '📕'} {d.title}
                  </button>
                ) : (
                  <a
                    href={`/api/documents/${d.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="documents-item-link"
                  >
                    📄 {d.title}
                  </a>
                )}
                <span className="documents-item-meta">{formatSize(d.sizeBytes)}</span>
                {!readOnly && (
                  <button className="documents-item-delete" onClick={() => setPendingDelete(d)} title="Löschen">
                    ✕
                  </button>
                )}
              </li>
            )
          )}
        </ul>
      )}

      {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.kind === 'link' ? 'Link löschen' : 'Unterlage löschen'}
          message={pendingDelete.kind === 'link' ? 'Diesen Link wirklich entfernen?' : 'Diese Datei wirklich löschen?'}
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
