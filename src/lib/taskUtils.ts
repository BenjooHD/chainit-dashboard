import type { Task } from '@/context/TaskContext';

export const STATUS_LABELS: Record<Task['status'], string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

export const STATUS_ORDER: Task['status'][] = ['open', 'in-progress', 'completed'];

export function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isOverdue(task: Task): boolean {
  return !!task.dueDate && task.status !== 'completed' && task.dueDate.slice(0, 10) < todayKey();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
