import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

const POLL_MS = 15000;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    const [list, count] = await Promise.all([
      apiGet('/notifications'),
      apiGet('/notifications/unread-count'),
    ]);
    setNotifications(list);
    setUnreadCount(count.count);
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    await apiPost('/notifications/read-all');
    await refresh();
  }, [refresh]);

  return { notifications, unreadCount, refresh, markAllRead };
}
