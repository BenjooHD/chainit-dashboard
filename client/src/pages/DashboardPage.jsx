import Header from '../components/layout/Header';
import KpiRow from '../components/kpi/KpiRow';
import TaskBoard from '../components/tasks/TaskBoard';
import CalendarMonthView from '../components/calendar/CalendarMonthView';
import ContactsTable from '../components/contacts/ContactsTable';
import AdminPanel from '../components/admin/AdminPanel';
import ChatPanel from '../components/chat/ChatPanel';
import PendingApproval from '../components/common/PendingApproval';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import { useTasks } from '../hooks/useTasks';
import { useContacts } from '../hooks/useContacts';
import './Dashboard.css';

export default function DashboardPage() {
  const { user, can, hasAnyAccess } = useAuth();
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const tasksHook = useTasks(refreshStats);
  const contactsHook = useContacts(refreshStats);

  return (
    <div>
      <Header />
      <div className="dashboard-layout">
        {hasAnyAccess ? (
          <>
            <KpiRow stats={stats} loading={statsLoading} />
            {can('calendar', 'view') && (
              <CalendarMonthView onChange={refreshStats} readOnly={!can('calendar', 'edit')} />
            )}
            {can('tasks', 'view') && <TaskBoard tasksHook={tasksHook} readOnly={!can('tasks', 'edit')} />}
            {can('contacts', 'view') && (
              <ContactsTable contactsHook={contactsHook} readOnly={!can('contacts', 'edit')} />
            )}
          </>
        ) : (
          <PendingApproval />
        )}

        {user?.isAdmin && <AdminPanel />}

        <ChatPanel />
      </div>
    </div>
  );
}
