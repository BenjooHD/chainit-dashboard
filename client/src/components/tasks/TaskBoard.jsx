import { useState } from 'react';
import TaskCard from './TaskCard';
import TaskFormModal from './TaskFormModal';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import './Tasks.css';

const COLUMNS = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Arbeit' },
  { status: 'done', title: 'Erledigt' },
];

export default function TaskBoard({ tasksHook, readOnly = false }) {
  const { tasks, projects, assignees, create, update, remove, createProject } = tasksHook;
  const [editingTask, setEditingTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleStatusChange = (id, status) => update(id, { status });
  const handleEdit = (task) => {
    if (!readOnly) setEditingTask(task);
  };

  const handleSave = async (payload) => {
    if (editingTask) {
      await update(editingTask.id, payload);
    } else {
      await create(payload);
    }
  };

  const handleDelete = (id) => {
    setPendingDelete(id);
    setEditingTask(null);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Aufgaben</h2>
        {!readOnly && <Button onClick={() => setShowCreate(true)}>+ Aufgabe</Button>}
      </div>

      <div className="task-board">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div className="task-column" key={col.status}>
              <div className="task-column-header">
                <span className="task-column-title">{col.title}</span>
                <span className="task-column-count">{columnTasks.length}</span>
              </div>
              <div className="task-column-body">
                {columnTasks.length === 0 && <div className="task-empty">Keine Aufgaben</div>}
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={readOnly ? undefined : handleStatusChange}
                    onEdit={handleEdit}
                    readOnly={readOnly}
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
          projects={projects}
          assignees={assignees}
          onClose={() => {
            setShowCreate(false);
            setEditingTask(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          onCreateProject={createProject}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Aufgabe löschen"
          message="Diese Aufgabe wirklich löschen?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </section>
  );
}
