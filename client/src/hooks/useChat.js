import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

const POLL_MS = 4000;

export function useChatUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet('/messages/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  return { users, loading, refresh };
}

export function useConversation(otherUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const data = await apiGet(`/messages/${otherUserId}`);
      setMessages(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    if (!otherUserId) return;
    setLoading(true);
    refresh();
    intervalRef.current = setInterval(refresh, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [otherUserId, refresh]);

  const send = useCallback(
    async (body) => {
      const msg = await apiPost(`/messages/${otherUserId}`, { body });
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [otherUserId]
  );

  return { messages, loading, error, send, refresh };
}
