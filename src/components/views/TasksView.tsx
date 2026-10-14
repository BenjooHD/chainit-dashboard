'use client';

import { useState } from 'react';
import { useTask, Task } from '@/context/TaskContext';
import { useToast } from '@/components/common/ToastProvider';
import Button from '@/components/common/Button';
import TaskCard from '@/components/TaskCard';
import TaskFormModal from '@/components/TaskFormModal';
import TaskFilters from '@/components/TaskFilters';
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/taskUtils';

export default function TasksView() {
  const { tasks, buckets, updateTask } = useTask();
  const showToast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBucket, setFilterBucket] = useState('all');

  const filteredTasks = tasks.filter(task => {
    if (filterAssignee !== 'all' && task.assignedTo !== filterAssignee) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterBucket !== 'all' && task.bucket !== filterBucket) return false;
    return true;
  });

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      await updateTask(id, { status });
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Error updating task status', 'error');
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Tasks ({filteredTasks.length})</h2>
        <Button onClick={() => setShowCreate(true)}>+ Task</Button>
      </div>

      <TaskFilters
        filterAssignee={filterAssignee}
        setFilterAssignee={setFilterAssignee}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterBucket={filterBucket}
        setFilterBucket={setFilterBucket}
      />

      <div className="task-board">
        {STATUS_ORDER.map(status => {
          const columnTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div className="task-column" key={status}>
              <div className="task-column-header">
                <span className="task-column-title">{STATUS_LABELS[status]}</span>
                <span className="task-column-count">{columnTasks.length}</span>
              </div>
              <div className="task-column-body">
                {columnTasks.length === 0 && <div className="task-empty">No tasks</div>}
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    bucketColor={buckets.find(b => b.name === task.bucket)?.color}
                    onEdit={setEditingTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(showCreate || editingTask) && (
        <TaskFormModal
          task={editingTask}
          onClose={() => {
            setShowCreate(false);
            setEditingTask(null);
          }}
        />
      )}
    </section>
  );
}
