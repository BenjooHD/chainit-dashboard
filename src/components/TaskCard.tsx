'use client';

import type { Task } from '@/context/TaskContext';
import { bucketHex } from '@/lib/bucketColors';
import { STATUS_LABELS, STATUS_ORDER, formatDate, isOverdue } from '@/lib/taskUtils';

interface TaskCardProps {
  task: Task;
  bucketColor?: string;
  showBucket?: boolean;
  isDragged?: boolean;
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDragStart?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  bucketColor,
  showBucket = true,
  isDragged = false,
  onEdit,
  onStatusChange,
  onDragStart,
}: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <div
      className={`task-card ${isDragged ? 'task-card-dragging' : ''}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? () => onDragStart(task.id) : undefined}
      onClick={() => onEdit(task)}
    >
      <div className="task-card-top">
        {showBucket && task.bucket && (
          <span className="task-project-tag" style={{ background: bucketHex(bucketColor) }}>
            {task.bucket}
          </span>
        )}
        <span className={`pill pill-${task.priority}`}>{task.priority}</span>
      </div>
      <div className={`task-title ${task.status === 'completed' ? 'task-title-done' : ''}`}>{task.title}</div>
      {task.description && <div className="task-desc">{task.description}</div>}
      {task.assignedTo && task.assignedTo !== 'Unassigned' && (
        <div className="task-assignee">
          <span className="task-assignee-avatar">{task.assignedTo[0]?.toUpperCase()}</span>
          {task.assignedTo}
        </div>
      )}
      {task.dueDate && (
        <div className={`task-due ${overdue ? 'task-due-overdue' : ''}`}>Due: {formatDate(task.dueDate)}</div>
      )}
      <select
        className="task-status-select"
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
      >
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
