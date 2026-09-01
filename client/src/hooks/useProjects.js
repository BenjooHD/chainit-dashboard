import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client';
import { useToast } from '../components/common/ToastProvider';

export function useProjects() {
  const showToast = useToast();
  const [projects, setProjects] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, ownerRows] = await Promise.all([apiGet('/projects'), apiGet('/projects/owners')]);
      setProjects(data);
      setOwners(ownerRows);
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
      showToast('Projekt erstellt', 'success');
      return created;
    },
    [refresh, showToast]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPatch(`/projects/${id}`, payload);
      await refresh();
      showToast('Projekt aktualisiert', 'success');
      return updated;
    },
    [refresh, showToast]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/projects/${id}`);
      await refresh();
      showToast('Projekt gelöscht', 'success');
    },
    [refresh, showToast]
  );

  return { projects, owners, loading, error, refresh, create, update, remove };
}
