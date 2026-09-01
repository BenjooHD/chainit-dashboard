import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../api/client';
import { useToast } from '../components/common/ToastProvider';

export function useFeedback() {
  const showToast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/feedback');
      setPosts(data);
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
      const created = await apiPost('/feedback', payload);
      await refresh();
      showToast('Feedback gepostet', 'success');
      return created;
    },
    [refresh, showToast]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/feedback/${id}`);
      await refresh();
      showToast('Beitrag gelöscht', 'success');
    },
    [refresh, showToast]
  );

  return { posts, loading, error, refresh, create, remove };
}
