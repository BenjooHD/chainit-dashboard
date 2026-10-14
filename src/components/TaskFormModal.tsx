'use client';

import { useState } from 'react';
import { useTask, Task } from '@/context/TaskContext';
import { useToast } from '@/components/common/ToastProvider';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/taskUtils';

interface TaskFormModalProps {
  task?: Task | null;
  defaultBucket?: string;
  onClose: () => void;
}

export default function TaskFormModal({ task, defaultBucket, onClose }: TaskFormModalProps) {
  const { addTask, updateTask, deleteTask, buckets } = useTask();
  const showToast = useToast();

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: (task?.assignedTo || 'Unassigned') as Task['assignedTo'],
    priority: (task?.priority || 'medium') as Task['priority'],
    status: (task?.status || 'open') as Task['status'],
    dueDate: task?.dueDate || '',
    bucket: task?.bucket || defaultBucket || buckets[0]?.name || 'Development',
    notes: task?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (task) {
        await updateTask(task.id, formData);
      } else {
        await addTask(formData);
      }
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Error saving task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      onClose();
    } catch (err) {
      console.error('Error deleting task:', err);
      setConfirmDelete(false);
      showToast('Error deleting task', 'error');
    }
  };

  const set = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <>
      <Modal
        title={task ? 'Edit Task' : 'New Task'}
        onClose={onClose}
        footer={
          <>
            {task ? (
              <Button variant="danger" type="button" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" form="task-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit} className="form-stack">
          {error && <div className="form-error">{error}</div>}
          <label>
            Title
            <input value={formData.title} onChange={(e) => set('title', e.target.value)} autoFocus />
          </label>
          <label>
            Description
            <textarea rows={3} value={formData.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Assigned to
              <select value={formData.assignedTo} onChange={(e) => set('assignedTo', e.target.value as Task['assignedTo'])}>
                <option value="Unassigned">Unassigned</option>
                <option value="Ben Joona">Ben Joona</option>
                <option value="Noah">Noah</option>
              </select>
            </label>
            <label>
              Priority
              <select value={formData.priority} onChange={(e) => set('priority', e.target.value as Task['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Status
              <select value={formData.status} onChange={(e) => set('status', e.target.value as Task['status'])}>
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={formData.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} />
            </label>
          </div>
          <label>
            Bucket
            <select value={formData.bucket} onChange={(e) => set('bucket', e.target.value)}>
              {buckets.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea rows={2} value={formData.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>
        </form>
      </Modal>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete task"
          message="Do you really want to delete this task?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
