import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client';
import { useToast } from '../components/common/ToastProvider';

export function useTasks(onChange) {
  const showToast = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p, a] = await Promise.all([
        apiGet('/tasks'),
        apiGet('/tasks/projects'),
        apiGet('/tasks/assignees'),
      ]);
      setTasks(t);
      setProjects(p);
      setAssignees(a);
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
      const created = await apiPost('/tasks', payload);
      await refresh();
      onChange?.();
      showToast('Aufgabe erstellt', 'success');
      return created;
    },
    [refresh, onChange, showToast]
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await apiPatch(`/tasks/${id}`, payload);
      await refresh();
      onChange?.();
      showToast('Aufgabe aktualisiert', 'success');
      return updated;
    },
    [refresh, onChange, showToast]
  );

  const remove = useCallback(
    async (id) => {
      await apiDelete(`/tasks/${id}`);
      await refresh();
      onChange?.();
      showToast('Aufgabe gelöscht', 'success');
    },
    [refresh, onChange, showToast]
  );

  const createProject = useCallback(
    async (payload) => {
      const created = await apiPost('/tasks/projects', payload);
      await refresh();
      return created;
    },
    [refresh]
  );

  return { tasks, projects, assignees, loading, error, refresh, create, update, remove, createProject };
}
