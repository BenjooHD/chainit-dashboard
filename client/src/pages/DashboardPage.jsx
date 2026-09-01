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
import MailTopStrip from '../components/mail/MailTopStrip';
import AgendaPanel from '../components/agenda/AgendaPanel';
import AdminPanel from '../components/admin/AdminPanel';
import ChatWidget from '../components/chat/ChatWidget';
import PendingApproval from '../components/common/PendingApproval';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import { useTasks } from '../hooks/useTasks';
import { useContacts } from '../hooks/useContacts';
import { useUpcomingEvents } from '../hooks/useUpcomingEvents';
import { useMailList } from '../hooks/useMail';
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

  const urgentRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);

  const canCalendar = can('calendar', 'view');
  const canTasks = can('tasks', 'view');
  const canContacts = can('contacts', 'view');
  const canProjects = can('projects', 'view');
  const canMail = can('mail', 'view');
  const canAgenda = can('agenda', 'view');
  const canAdmin = !!user?.isAdmin;

  const sectionDefs = [
    { key: 'calendar', label: 'Kalender', show: canCalendar },
    { key: 'tasks', label: 'Aufgaben', show: canTasks },
    { key: 'contacts', label: 'Kontakte', show: canContacts },
    { key: 'projects', label: 'Projekte', show: canProjects },
    { key: 'mail', label: 'Mail', show: canMail },
    { key: 'agenda', label: 'Besprechung', show: canAgenda },
    { key: 'admin', label: 'Team verwalten', show: canAdmin },
  ];

  const [activeSection, setActiveSection] = useState(
    () => sectionDefs.find((s) => s.show)?.key || null
  );

  const { events: upcomingEvents, loading: eventsLoading, refresh: refreshUpcomingEvents } = useUpcomingEvents(
    UPCOMING_DAYS,
    canCalendar
  );
  const {
    messages: mailMessages,
    loading: mailLoading,
    notConfigured: mailNotConfigured,
    error: mailError,
    refresh: refreshMail,
    markAllRead: markAllMailRead,
    toggleFlag: toggleMailFlag,
  } = useMailList(canMail);
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
        canMail={canMail}
        mailMessages={mailMessages}
        mailNotConfigured={mailNotConfigured}
      />
      {canMail && (
        <MailTopStrip
          messages={mailMessages}
          loading={mailLoading}
          notConfigured={mailNotConfigured}
          error={mailError}
        />
      )}
      {hasAnyAccess && (
        <QuickNav
          sections={[
            ...sectionDefs.map((s) => ({
              ...s,
              onClick: () => setActiveSection(s.key),
              active: activeSection === s.key,
            })),
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
            {canCalendar && activeSection === 'calendar' && (
              <CalendarMonthView onChange={handleCalendarChange} readOnly={!can('calendar', 'edit')} />
            )}
            {canTasks && activeSection === 'tasks' && (
              <TaskBoard tasksHook={tasksHook} readOnly={!can('tasks', 'edit')} />
            )}
            {canContacts && activeSection === 'contacts' && (
              <ContactsTable contactsHook={contactsHook} readOnly={!can('contacts', 'edit')} />
            )}
            {canProjects && activeSection === 'projects' && (
              <ProjectsPanel readOnly={!can('projects', 'edit')} />
            )}
            {canMail && activeSection === 'mail' && (
              <MailPanel
                messages={mailMessages}
                loading={mailLoading}
                error={mailError}
                notConfigured={mailNotConfigured}
                refresh={refreshMail}
                markAllRead={markAllMailRead}
                toggleFlag={toggleMailFlag}
              />
            )}
            {canAgenda && activeSection === 'agenda' && <AgendaPanel readOnly={!can('agenda', 'edit')} />}
            {canAdmin && activeSection === 'admin' && <AdminPanel />}
          </>
        ) : (
          <PendingApproval />
        )}
      </div>

      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
