import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/projects');
      setProjects(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload) => {
      const created = await apiPost('/projects', payload);
      await refresh();
      return created;
    },
    [refresh]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPatch(`/projects/${id}`, payload);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/projects/${id}`);
      await refresh();
    },
    [refresh]
  );

  return { projects, loading, error, refresh, create, update, remove };
}
