import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export function useUpcomingEvents(days, enabled) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      const all = await apiGet('/events');
      const now = new Date();
      const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const upcoming = all
        .filter((e) => {
          const start = new Date(e.startAt);
          return start >= now && start <= end;
        })
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      setEvents(upcoming);
    } finally {
      setLoading(false);
    }
  }, [enabled, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, refresh };
}
