'use client';

import { useState } from 'react';
import { useTask, Bucket, Task } from '@/context/TaskContext';
import { useToast } from '@/components/common/ToastProvider';
import Button from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import KanbanBucketColumn from '@/components/KanbanBucketColumn';
import KanbanBucketManager from '@/components/KanbanBucketManager';
import TaskFormModal from '@/components/TaskFormModal';

export default function KanbanView() {
  const { tasks, buckets, updateTask, deleteBucket } = useTask();
  const showToast = useToast();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showBucketManager, setShowBucketManager] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Bucket | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDrop = async (e: React.DragEvent, bucketName: string) => {
    e.preventDefault();
    if (!draggedTask) return;
    try {
      await updateTask(draggedTask, { bucket: bucketName });
    } catch (error) {
      console.error('Error moving task:', error);
      showToast('Error moving task', 'error');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      await updateTask(id, { status });
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Error updating task status', 'error');
    }
  };

  const handleDeleteBucket = async () => {
    if (!pendingDelete) return;
    try {
      await deleteBucket(pendingDelete.id);
    } catch (error) {
      console.error('Error deleting bucket:', error);
      showToast('Error deleting bucket', 'error');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Kanban Board</h2>
        <Button onClick={() => setShowBucketManager(true)}>+ Bucket</Button>
      </div>

      {buckets.length === 0 ? (
        <div className="empty-state">No buckets yet. Create your first bucket to get started!</div>
      ) : (
        <div className="kanban-board">
          {buckets.map(bucket => (
            <KanbanBucketColumn
              key={bucket.id}
              bucket={bucket}
              tasks={tasks.filter(t => t.bucket === bucket.name)}
              draggedTask={draggedTask}
              onDragStart={setDraggedTask}
              onDrop={(e) => handleDrop(e, bucket.name)}
              onEditTask={setEditingTask}
              onStatusChange={handleStatusChange}
              onEdit={setEditingBucket}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {(showBucketManager || editingBucket) && (
        <KanbanBucketManager
          bucket={editingBucket || undefined}
          onClose={() => {
            setShowBucketManager(false);
            setEditingBucket(null);
          }}
        />
      )}

      {editingTask && <TaskFormModal task={editingTask} onClose={() => setEditingTask(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete bucket"
          message={`Delete bucket "${pendingDelete.name}"?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteBucket}
        />
      )}
    </section>
  );
}
