import KpiTile from './KpiTile';
import './Kpi.css';

export default function KpiRow({ stats, loading }) {
  const s = stats || {};
  return (
    <div className="kpi-row">
      <KpiTile label="Offene Aufgaben" value={loading ? '–' : s.openTasks ?? 0} />
      <KpiTile
        label="Termine (7 Tage)"
        value={loading ? '–' : s.upcomingEventsThisWeek ?? 0}
        accent="var(--color-accent)"
      />
      <KpiTile label="Kontakte gesamt" value={loading ? '–' : s.totalContacts ?? 0} />
      <KpiTile
        label="Erledigt (7 Tage)"
        value={loading ? '–' : s.tasksCompletedThisWeek ?? 0}
        accent="var(--color-success)"
      />
    </div>
  );
}
