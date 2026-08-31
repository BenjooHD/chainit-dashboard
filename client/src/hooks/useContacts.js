import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';

export function useContacts(onChange) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/contacts');
      setContacts(data);
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
      const created = await apiPost('/contacts', payload);
      await refresh();
      onChange?.();
      return created;
    },
    [refresh, onChange]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPut(`/contacts/${id}`, payload);
      await refresh();
      onChange?.();
      return updated;
    },
    [refresh, onChange]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/contacts/${id}`);
      await refresh();
      onChange?.();
    },
    [refresh, onChange]
  );

  return { contacts, loading, error, refresh, create, update, remove };
}
