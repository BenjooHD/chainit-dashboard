import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../api/client';

export function useMailList(enabled = true) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(enabled);
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
    if (enabled) refresh();
  }, [refresh, enabled]);

  const markAllRead = useCallback(async () => {
    await apiPatch('/mail/mark-all-read');
    setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
  }, []);

  const toggleFlag = useCallback(async (uid, flagged) => {
    await apiPatch(`/mail/${uid}/flag`, { flagged });
    setMessages((prev) => {
      const next = prev.map((m) => (m.uid === uid ? { ...m, flagged } : m));
      next.sort((a, b) => {
        const aTop = !a.seen || a.flagged ? 1 : 0;
        const bTop = !b.seen || b.flagged ? 1 : 0;
        if (aTop !== bTop) return bTop - aTop;
        return new Date(b.date) - new Date(a.date);
      });
      return next;
    });
  }, []);

  return { messages, loading, error, notConfigured, refresh, markAllRead, toggleFlag };
}

// Splits the already-priority-sorted message list into the "important or unread"
// slice shown up top (header strip) and everything else (mail icon dropdown),
// so a read/non-flagged mail never silently vanishes from both compact views.
export function splitMailByPriority(messages, limit = 3) {
  const top = messages.filter((m) => !m.seen || m.flagged).slice(0, limit);
  const topUids = new Set(top.map((m) => m.uid));
  const rest = messages.filter((m) => !topUids.has(m.uid));
  return { top, rest };
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
