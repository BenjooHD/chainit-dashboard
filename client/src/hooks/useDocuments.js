import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiUpload } from '../api/client';

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

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/documents/${id}`);
      await refresh();
    },
    [refresh]
  );

  return { documents, loading, error, refresh, upload, remove };
}
