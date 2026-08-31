import { useTodayEvents } from '../../hooks/useTodayEvents';
import './UrgentPanel.css';

function todayKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function UrgentPanel({ tasks, showTasks, showCalendar }) {
  const { events: todayEvents, loading: eventsLoading } = useTodayEvents(showCalendar);

  const overdueTasks = showTasks
    ? tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayKey())
    : [];

  const hasAnything = overdueTasks.length > 0 || todayEvents.length > 0;
  if (!showTasks && !showCalendar) return null;
  if (!eventsLoading && !hasAnything) return null;

  return (
    <section className="panel urgent-panel">
      <div className="panel-header">
        <h2>Aktuelles</h2>
      </div>
      {!hasAnything && !eventsLoading && (
        <div className="task-empty">Nichts Dringendes gerade.</div>
      )}
      {overdueTasks.length > 0 && (
        <div className="urgent-group">
          <div className="urgent-group-title">Überfällige Aufgaben ({overdueTasks.length})</div>
          {overdueTasks.slice(0, 5).map((t) => (
            <div key={t.id} className="urgent-item urgent-item-danger">
              {t.title} <span className="urgent-meta">fällig {t.dueDate}</span>
            </div>
          ))}
        </div>
      )}
      {todayEvents.length > 0 && (
        <div className="urgent-group">
          <div className="urgent-group-title">Termine heute ({todayEvents.length})</div>
          {todayEvents.map((e) => (
            <div key={e.id} className="urgent-item">
              {e.title} <span className="urgent-meta">{formatTime(e.startAt)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
