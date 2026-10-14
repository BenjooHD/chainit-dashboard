'use client';

import { useState } from 'react';
import { Task, Bucket } from '@/context/TaskContext';
import { bucketHex } from '@/lib/bucketColors';
import TaskCard from '@/components/TaskCard';

interface KanbanBucketColumnProps {
  bucket: Bucket;
  tasks: Task[];
  draggedTask: string | null;
  onDragStart: (taskId: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit: (bucket: Bucket) => void;
  onDelete: (bucket: Bucket) => void;
}

export default function KanbanBucketColumn({
  bucket,
  tasks,
  draggedTask,
  onDragStart,
  onDrop,
  onEditTask,
  onStatusChange,
  onEdit,
  onDelete,
}: KanbanBucketColumnProps) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`task-column kanban-column ${over ? 'kanban-column-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        onDrop(e);
      }}
    >
      <div className="task-column-header">
        <div className="task-column-title-wrap">
          <span className="bucket-dot" style={{ background: bucketHex(bucket.color) }} />
          <span className="task-column-title">{bucket.name}</span>
        </div>
        <div className="column-actions">
          <span className="task-column-count">{tasks.length}</span>
          <button className="icon-btn" onClick={() => onEdit(bucket)} title="Edit bucket">
            Edit
          </button>
          <button className="icon-btn icon-btn-danger" onClick={() => onDelete(bucket)} title="Delete bucket">
            ✕
          </button>
        </div>
      </div>
      <div className="task-column-body">
        {tasks.length === 0 && <div className="task-empty">No tasks in this bucket</div>}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            showBucket={false}
            isDragged={draggedTask === task.id}
            onDragStart={onDragStart}
            onEdit={onEditTask}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
