import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../api/client';
import { useToast } from '../components/common/ToastProvider';

export function useInvoices() {
  const showToast = useToast();
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
      showToast(`Rechnung ${created.invoiceNumber} erstellt`, 'success');
      return created;
    },
    [refresh, showToast]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPut(`/invoices/${id}`, payload);
      await refresh();
      showToast('Rechnung aktualisiert', 'success');
      return updated;
    },
    [refresh, showToast]
  );

  const setStatus = useCallback(
    async (id, status) => {
      await apiPatch(`/invoices/${id}/status`, { status });
      await refresh();
      showToast('Status aktualisiert', 'success');
    },
    [refresh, showToast]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/invoices/${id}`);
      await refresh();
      showToast('Rechnung gelöscht', 'success');
    },
    [refresh, showToast]
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
  const showToast = useToast();
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
      showToast('Einstellungen gespeichert', 'success');
      return updated;
    },
    [showToast]
  );

  return { settings, loading, error, refresh, update };
}
