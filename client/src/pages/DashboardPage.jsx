import { useRef } from 'react';
import Header from '../components/layout/Header';
import QuickNav from '../components/layout/QuickNav';
import KpiRow from '../components/kpi/KpiRow';
import UrgentPanel from '../components/common/UrgentPanel';
import TaskBoard from '../components/tasks/TaskBoard';
import CalendarMonthView from '../components/calendar/CalendarMonthView';
import ContactsTable from '../components/contacts/ContactsTable';
import AdminPanel from '../components/admin/AdminPanel';
import ChatWidget from '../components/chat/ChatWidget';
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

  const calendarRef = useRef(null);
  const tasksRef = useRef(null);
  const contactsRef = useRef(null);
  const adminRef = useRef(null);

  const canCalendar = can('calendar', 'view');
  const canTasks = can('tasks', 'view');
  const canContacts = can('contacts', 'view');

  return (
    <div>
      <Header />
      {hasAnyAccess && (
        <QuickNav
          sections={[
            { key: 'calendar', label: 'Kalender', ref: calendarRef, show: canCalendar },
            { key: 'tasks', label: 'Aufgaben', ref: tasksRef, show: canTasks },
            { key: 'contacts', label: 'Kontakte', ref: contactsRef, show: canContacts },
            { key: 'admin', label: 'Team verwalten', ref: adminRef, show: !!user?.isAdmin },
          ]}
        />
      )}
      <div className="dashboard-layout">
        {hasAnyAccess ? (
          <>
            <UrgentPanel tasks={tasksHook.tasks} showTasks={canTasks} showCalendar={canCalendar} />
            <KpiRow stats={stats} loading={statsLoading} />
            {canCalendar && (
              <div ref={calendarRef}>
                <CalendarMonthView onChange={refreshStats} readOnly={!can('calendar', 'edit')} />
              </div>
            )}
            {canTasks && (
              <div ref={tasksRef}>
                <TaskBoard tasksHook={tasksHook} readOnly={!can('tasks', 'edit')} />
              </div>
            )}
            {canContacts && (
              <div ref={contactsRef}>
                <ContactsTable contactsHook={contactsHook} readOnly={!can('contacts', 'edit')} />
              </div>
            )}
          </>
        ) : (
          <PendingApproval />
        )}

        {user?.isAdmin && (
          <div ref={adminRef}>
            <AdminPanel />
          </div>
        )}
      </div>

      <ChatWidget />
    </div>
  );
}
