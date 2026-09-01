import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiUpload } from '../api/client';

export function useDocuments(projectId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const query = projectId ? `?projectId=${projectId}` : '';
      const data = await apiGet(`/documents${query}`);
      setDocuments(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async ({ file, title, description, projectId: forProjectId }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (forProjectId) formData.append('projectId', forProjectId);
      const created = await apiUpload('/documents', formData);
      await refresh();
      return created;
    },
    [refresh]
  );

  const addLink = useCallback(
    async ({ title, url, projectId: forProjectId }) => {
      const created = await apiPost('/documents/link', { title, url, projectId: forProjectId || null });
      await refresh();
      return created;
    },
    [refresh]
  );

  const remove = useCallback(
    async (doc) => {
      if (doc.kind === 'link') {
        await apiDelete(`/documents/link/${doc.id}`);
      } else {
        await apiDelete(`/documents/${doc.id}`);
      }
      await refresh();
    },
    [refresh]
  );

  return { documents, loading, error, refresh, upload, addLink, remove };
}
