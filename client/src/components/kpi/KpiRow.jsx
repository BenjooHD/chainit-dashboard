import KpiTile from './KpiTile';
import './Kpi.css';

export default function KpiRow({ stats, loading }) {
  const s = stats || {};
  const tiles = [
    { key: 'openTasks', label: 'Offene Aufgaben', value: s.openTasks },
    { key: 'upcomingEventsThisWeek', label: 'Termine (7 Tage)', value: s.upcomingEventsThisWeek, accent: 'var(--color-accent)' },
    { key: 'totalContacts', label: 'Kontakte gesamt', value: s.totalContacts },
    { key: 'tasksCompletedThisWeek', label: 'Erledigt (7 Tage)', value: s.tasksCompletedThisWeek, accent: 'var(--color-success)' },
  ].filter((t) => loading || t.value !== null);

  if (tiles.length === 0) return null;

  return (
    <div className="kpi-row">
      {tiles.map((t) => (
        <KpiTile key={t.key} label={t.label} value={loading ? '–' : t.value ?? 0} accent={t.accent} />
      ))}
    </div>
  );
}
