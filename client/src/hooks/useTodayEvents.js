import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../api/client';

function todayKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function useTodayEvents(enabled) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    try {
      const all = await apiGet(`/events?month=${month}`);
      const key = todayKey();
      setEvents(all.filter((e) => e.startAt.slice(0, 10) === key));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, refresh };
}
