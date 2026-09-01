import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../api/client';

export function useFeedback() {
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
      return created;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/feedback/${id}`);
      await refresh();
    },
    [refresh]
  );

  return { posts, loading, error, refresh, create, remove };
}
