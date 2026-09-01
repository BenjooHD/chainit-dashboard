import './UrgentPanel.css';

function formatEventWhen(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

function formatTaskDue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export default function UrgentPanel({ overdueTasks, upcomingTasks, importantEvents, loading, showTasks, showCalendar }) {
  const hasAnything = overdueTasks.length > 0 || upcomingTasks.length > 0 || importantEvents.length > 0;
  if (!showTasks && !showCalendar) return null;
  if (!loading && !hasAnything) return null;

  return (
    <section className="panel urgent-panel">
      <div className="panel-header">
        <h2>Aktuelles</h2>
      </div>
      {!hasAnything && !loading && <div className="task-empty">Nichts Dringendes gerade.</div>}
      {overdueTasks.length > 0 && (
        <div className="urgent-group">
          <div className="urgent-group-title">Überfällige Aufgaben ({overdueTasks.length})</div>
          {overdueTasks.slice(0, 5).map((t) => (
            <div key={t.id} className="urgent-item urgent-item-danger">
              {t.title} <span className="urgent-meta">fällig {formatTaskDue(t.dueDate)}</span>
            </div>
          ))}
        </div>
      )}
      {importantEvents.length > 0 && (
        <div className="urgent-group">
          <div className="urgent-group-title">Wichtige Termine (5 Tage) ({importantEvents.length})</div>
          {importantEvents.slice(0, 5).map((e) => (
            <div key={e.id} className="urgent-item urgent-item-danger">
              {e.title} <span className="urgent-meta">{formatEventWhen(e.startAt)}</span>
            </div>
          ))}
        </div>
      )}
      {upcomingTasks.length > 0 && (
        <div className="urgent-group">
          <div className="urgent-group-title">Aufgaben (5 Tage) ({upcomingTasks.length})</div>
          {upcomingTasks.slice(0, 5).map((t) => (
            <div key={t.id} className="urgent-item">
              {t.title} <span className="urgent-meta">fällig {formatTaskDue(t.dueDate)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
