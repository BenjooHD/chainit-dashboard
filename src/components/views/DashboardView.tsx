'use client';

import { useTask, Task } from '@/context/TaskContext';
import KpiTile from '@/components/KpiTile';
import { STATUS_LABELS, formatDate, isOverdue } from '@/lib/taskUtils';

export default function DashboardView({
  overdueTasks,
  highPriorityTasks,
  onSelectTab,
}: {
  overdueTasks: Task[];
  highPriorityTasks: Task[];
  onSelectTab: (tab: 'tasks') => void;
}) {
  const { tasks } = useTask();

  const total = tasks.length;
  const open = tasks.filter(t => t.status === 'open').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const team = ['Ben Joona', 'Noah'].map(name => ({
    name,
    count: tasks.filter(t => t.assignedTo === name).length,
  }));

  const hasUrgent = overdueTasks.length > 0 || highPriorityTasks.length > 0;

  return (
    <>
      {hasUrgent && (
        <section className="panel urgent-panel">
          <div className="panel-header">
            <h2>Urgent</h2>
          </div>
          {overdueTasks.length > 0 && (
            <div className="urgent-group">
              <div className="urgent-group-title">Overdue tasks ({overdueTasks.length})</div>
              {overdueTasks.slice(0, 5).map(t => (
                <div key={t.id} className="urgent-item urgent-item-danger">
                  {t.title} <span className="urgent-meta">due {formatDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
          {highPriorityTasks.length > 0 && (
            <div className="urgent-group">
              <div className="urgent-group-title">High priority ({highPriorityTasks.length})</div>
              {highPriorityTasks.slice(0, 5).map(t => (
                <div key={t.id} className="urgent-item">
                  {t.title} <span className="urgent-meta">{t.dueDate ? `due ${formatDate(t.dueDate)}` : t.assignedTo}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="kpi-row">
        <KpiTile label="Total tasks" value={total} onClick={() => onSelectTab('tasks')} />
        <KpiTile label="Open" value={open} onClick={() => onSelectTab('tasks')} />
        <KpiTile label="In progress" value={inProgress} accent="var(--color-accent)" onClick={() => onSelectTab('tasks')} />
        <KpiTile label={`Completed (${completionRate}%)`} value={completed} accent="var(--color-success)" onClick={() => onSelectTab('tasks')} />
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <h2>Team workload</h2>
          </div>
          {team.map(member => (
            <div key={member.name} className="workload-row">
              <span>{member.name}</span>
              <div className="workload-bar">
                <div
                  className="workload-bar-fill"
                  style={{ width: `${total > 0 ? (member.count / total) * 100 : 0}%` }}
                />
              </div>
              <span className="workload-count">{member.count}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Recent tasks</h2>
          </div>
          {tasks.length === 0 && <div className="task-empty">No tasks yet</div>}
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className="recent-item">
              <div>
                <div>{task.title}</div>
                <div className="recent-sub">
                  {task.assignedTo} • {task.bucket}
                </div>
              </div>
              <span className={`pill ${isOverdue(task) ? 'pill-high' : ''}`}>{STATUS_LABELS[task.status]}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
