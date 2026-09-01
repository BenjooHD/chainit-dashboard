import { useRef, useState } from 'react';
import Header from '../components/layout/Header';
import QuickNav from '../components/layout/QuickNav';
import KpiRow from '../components/kpi/KpiRow';
import UrgentPanel from '../components/common/UrgentPanel';
import TaskBoard from '../components/tasks/TaskBoard';
import CalendarMonthView from '../components/calendar/CalendarMonthView';
import ContactsTable from '../components/contacts/ContactsTable';
import ProjectsPanel from '../components/projects/ProjectsPanel';
import MailPanel from '../components/mail/MailPanel';
import AgendaPanel from '../components/agenda/AgendaPanel';
import AdminPanel from '../components/admin/AdminPanel';
import ChatWidget from '../components/chat/ChatWidget';
import PendingApproval from '../components/common/PendingApproval';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import { useTasks } from '../hooks/useTasks';
import { useContacts } from '../hooks/useContacts';
import { useUpcomingEvents } from '../hooks/useUpcomingEvents';
import './Dashboard.css';

const UPCOMING_DAYS = 5;

function dateKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DashboardPage() {
  const { user, can, hasAnyAccess } = useAuth();
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const tasksHook = useTasks(refreshStats);
  const contactsHook = useContacts(refreshStats);

  const calendarRef = useRef(null);
  const tasksRef = useRef(null);
  const contactsRef = useRef(null);
  const projectsRef = useRef(null);
  const mailRef = useRef(null);
  const agendaRef = useRef(null);
  const adminRef = useRef(null);
  const urgentRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);

  const canCalendar = can('calendar', 'view');
  const canTasks = can('tasks', 'view');
  const canContacts = can('contacts', 'view');
  const canProjects = can('projects', 'view');
  const canMail = can('mail', 'view');
  const canAgenda = can('agenda', 'view');

  const { events: upcomingEvents, loading: eventsLoading, refresh: refreshUpcomingEvents } = useUpcomingEvents(
    UPCOMING_DAYS,
    canCalendar
  );
  const importantEvents = upcomingEvents.filter((e) => e.priority === 'high');

  const todayStr = dateKey(new Date());
  const in5DaysStr = dateKey(new Date(Date.now() + UPCOMING_DAYS * 24 * 60 * 60 * 1000));
  const overdueTasks = canTasks
    ? tasksHook.tasks
        .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : [];
  const upcomingTasks = canTasks
    ? tasksHook.tasks
        .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate >= todayStr && t.dueDate <= in5DaysStr)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : [];

  const scrollToUrgent = () => urgentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleCalendarChange = () => {
    refreshStats();
    refreshUpcomingEvents();
  };

  return (
    <div>
      <Header
        overdueTasks={overdueTasks}
        importantEvents={importantEvents}
        upcomingTasks={upcomingTasks}
        onJumpToUrgent={scrollToUrgent}
      />
      {hasAnyAccess && (
        <QuickNav
          sections={[
            { key: 'calendar', label: 'Kalender', ref: calendarRef, show: canCalendar },
            { key: 'tasks', label: 'Aufgaben', ref: tasksRef, show: canTasks },
            { key: 'contacts', label: 'Kontakte', ref: contactsRef, show: canContacts },
            { key: 'projects', label: 'Projekte', ref: projectsRef, show: canProjects },
            { key: 'mail', label: 'Mail', ref: mailRef, show: canMail },
            { key: 'agenda', label: 'Besprechung', ref: agendaRef, show: canAgenda },
            { key: 'admin', label: 'Team verwalten', ref: adminRef, show: !!user?.isAdmin },
            { key: 'chat', label: 'Chat', onClick: () => setChatOpen(true), show: true },
          ]}
        />
      )}
      <div className="dashboard-layout">
        {hasAnyAccess ? (
          <>
            <div ref={urgentRef}>
              <UrgentPanel
                overdueTasks={overdueTasks}
                upcomingTasks={upcomingTasks}
                importantEvents={importantEvents}
                loading={eventsLoading}
                showTasks={canTasks}
                showCalendar={canCalendar}
              />
            </div>
            <KpiRow stats={stats} loading={statsLoading} />
            {canCalendar && (
              <div ref={calendarRef}>
                <CalendarMonthView onChange={handleCalendarChange} readOnly={!can('calendar', 'edit')} />
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
            {canProjects && (
              <div ref={projectsRef}>
                <ProjectsPanel readOnly={!can('projects', 'edit')} />
              </div>
            )}
            {canMail && (
              <div ref={mailRef}>
                <MailPanel />
              </div>
            )}
            {canAgenda && (
              <div ref={agendaRef}>
                <AgendaPanel readOnly={!can('agenda', 'edit')} />
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

      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
