import './Tasks.css';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Arbeit' },
  { value: 'done', label: 'Erledigt' },
];

export default function TaskCard({ task, onStatusChange, onEdit, readOnly = false }) {
  return (
    <div className={`task-card ${readOnly ? 'task-card-readonly' : ''}`} onClick={() => onEdit(task)}>
      {task.projectName && (
        <span className="task-project-tag" style={{ background: task.projectColor || '#c4b5fd' }}>
          {task.projectName}
        </span>
      )}
      <div className="task-title">{task.title}</div>
      {task.assigneeUsername && (
        <div className="task-assignee">
          <span className="task-assignee-avatar">{task.assigneeUsername[0]?.toUpperCase()}</span>
          {task.assigneeUsername}
        </div>
      )}
      {task.dueDate && <div className="task-due">Fällig: {task.dueDate}</div>}
      {readOnly ? (
        <div className="task-status-readonly">
          {STATUS_OPTIONS.find((o) => o.value === task.status)?.label}
        </div>
      ) : (
        <select
          className="task-status-select"
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
