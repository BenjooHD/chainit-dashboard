import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../api/client';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/invoices');
      setInvoices(data);
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
      const created = await apiPost('/invoices', payload);
      await refresh();
      return created;
    },
    [refresh]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPut(`/invoices/${id}`, payload);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const setStatus = useCallback(
    async (id, status) => {
      await apiPatch(`/invoices/${id}/status`, { status });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/invoices/${id}`);
      await refresh();
    },
    [refresh]
  );

  return { invoices, loading, error, refresh, create, update, setStatus, remove };
}

export function useInvoice(id) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet(`/invoices/${id}`)
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { invoice, loading, error };
}

export function useInvoiceSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/invoices/settings');
      setSettings(data);
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

  const update = useCallback(
    async (payload) => {
      const updated = await apiPatch('/invoices/settings', payload);
      setSettings(updated);
      return updated;
    },
    []
  );

  return { settings, loading, error, refresh, update };
}
