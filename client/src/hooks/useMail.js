import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export function useMailList() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const data = await apiGet('/mail');
      setMessages(data);
    } catch (e) {
      if (e.code === 'MAIL_NOT_CONFIGURED') setNotConfigured(true);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { messages, loading, error, notConfigured, refresh };
}

export function useMailMessage(uid) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    apiGet(`/mail/${uid}`)
      .then(setMessage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [uid]);

  return { message, loading, error };
}
