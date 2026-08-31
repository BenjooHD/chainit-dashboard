import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function useEvents(monthDate, onChange) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/events?month=${monthKey(monthDate)}`);
      setEvents(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [monthDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload) => {
      const created = await apiPost('/events', payload);
      await refresh();
      onChange?.();
      return created;
    },
    [refresh, onChange]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPut(`/events/${id}`, payload);
      await refresh();
      onChange?.();
      return updated;
    },
    [refresh, onChange]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/events/${id}`);
      await refresh();
      onChange?.();
    },
    [refresh, onChange]
  );

  return { events, loading, error, refresh, create, update, remove };
}
