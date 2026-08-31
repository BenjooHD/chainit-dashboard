import Header from '../components/layout/Header';
import KpiRow from '../components/kpi/KpiRow';
import TaskBoard from '../components/tasks/TaskBoard';
import CalendarMonthView from '../components/calendar/CalendarMonthView';
import ContactsTable from '../components/contacts/ContactsTable';
import { useStats } from '../hooks/useStats';
import { useTasks } from '../hooks/useTasks';
import { useContacts } from '../hooks/useContacts';
import './Dashboard.css';

export default function DashboardPage() {
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const tasksHook = useTasks(refreshStats);
  const contactsHook = useContacts(refreshStats);

  return (
    <div>
      <Header />
      <div className="dashboard-layout">
        <KpiRow stats={stats} loading={statsLoading} />
        <CalendarMonthView onChange={refreshStats} />
        <TaskBoard tasksHook={tasksHook} />
        <ContactsTable contactsHook={contactsHook} />
      </div>
    </div>
  );
}
