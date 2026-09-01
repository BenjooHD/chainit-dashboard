import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client';
import { useToast } from '../components/common/ToastProvider';

export function useAgenda() {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/agenda');
      setItems(data);
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
      const created = await apiPost('/agenda', payload);
      await refresh();
      showToast('Punkt hinzugefügt', 'success');
      return created;
    },
    [refresh, showToast]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPatch(`/agenda/${id}`, payload);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/agenda/${id}`);
      await refresh();
      showToast('Punkt gelöscht', 'success');
    },
    [refresh, showToast]
  );

  return { items, loading, error, refresh, create, update, remove };
}
