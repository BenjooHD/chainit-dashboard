import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';
import { useToast } from '../components/common/ToastProvider';

export function useCosts() {
  const showToast = useToast();
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/costs');
      setCosts(data);
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
      const created = await apiPost('/costs', payload);
      await refresh();
      showToast('Kosten erfasst', 'success');
      return created;
    },
    [refresh, showToast]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPut(`/costs/${id}`, payload);
      await refresh();
      showToast('Kosten aktualisiert', 'success');
      return updated;
    },
    [refresh, showToast]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/costs/${id}`);
      await refresh();
      showToast('Kosten gelöscht', 'success');
    },
    [refresh, showToast]
  );

  return { costs, loading, error, refresh, create, update, remove };
}
