import { useRef, useState } from 'react';
import Header from '../components/layout/Header';
import QuickNav from '../components/layout/QuickNav';
import KpiRow from '../components/kpi/KpiRow';
import UrgentPanel from '../components/common/UrgentPanel';
import TaskBoard from '../components/tasks/TaskBoard';
import CalendarMonthView from '../components/calendar/CalendarMonthView';
import ContactsTable from '../components/contacts/ContactsTable';
import ProjectsPanel from '../components/projects/ProjectsPanel';
import GeneralDocumentsPanel from '../components/projects/GeneralDocumentsPanel';
import MailPanel from '../components/mail/MailPanel';
import MailTopStrip from '../components/mail/MailTopStrip';
import AgendaPanel from '../components/agenda/AgendaPanel';
import CostsPanel from '../components/costs/CostsPanel';
import InvoicesPanel from '../components/invoices/InvoicesPanel';
import AdminPanel from '../components/admin/AdminPanel';
import FeedbackPanel from '../components/feedback/FeedbackPanel';
import ChatWidget from '../components/chat/ChatWidget';
import PendingApproval from '../components/common/PendingApproval';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import { useTasks } from '../hooks/useTasks';
import { useContacts } from '../hooks/useContacts';
import { useUpcomingEvents } from '../hooks/useUpcomingEvents';
import { useMailList, splitMailByPriority } from '../hooks/useMail';
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
  const canCosts = can('costs', 'view');
  const canInvoices = can('invoices', 'view');
  const canFeedback = can('feedback', 'view');
  const canAdmin = !!user?.isAdmin;

  const sectionDefs = [
    { key: 'calendar', label: 'Kalender', show: canCalendar },
    { key: 'tasks', label: 'Aufgaben', show: canTasks },
    { key: 'contacts', label: 'Kontakte', show: canContacts },
    { key: 'projects', label: 'Projekte', show: canProjects },
    { key: 'documents', label: 'Unterlagen', show: canProjects },
    { key: 'costs', label: 'Kosten', show: canCosts },
    { key: 'mail', label: 'Mail', show: canMail },
    { key: 'agenda', label: 'Besprechung', show: canAgenda },
    { key: 'feedback', label: 'Feedback', show: canFeedback },
    { key: 'invoices', label: 'Rechnungen', show: canInvoices },
    { key: 'admin', label: 'Team verwalten', show: canAdmin },
  ];

  // null = home overview (KPI/Aktuelles + the everyday sections stacked below).
  // Mail and Team verwalten are deliberately left out of the overview and only
  // appear once their nav button is clicked.
  const [activeSection, setActiveSection] = useState(null);

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
  const { top: mailTopMessages, rest: mailRestMessages } = splitMailByPriority(mailMessages);

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

  const scrollToUrgent = () => {
    setActiveSection(null);
    requestAnimationFrame(() => urgentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
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
        onLogoClick={() => {
          setActiveSection(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        canMail={canMail}
        mailMessages={mailRestMessages}
        mailNotConfigured={mailNotConfigured}
      />
      {canMail && (
        <MailTopStrip
          messages={mailTopMessages}
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
              onClick: () => setActiveSection((cur) => (cur === s.key ? null : s.key)),
              active: activeSection === s.key,
            })),
            { key: 'chat', label: 'Chat', onClick: () => setChatOpen(true), show: true },
          ]}
        />
      )}
      <div className="dashboard-layout">
        {hasAnyAccess ? (
          activeSection === null ? (
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
              <KpiRow stats={stats} loading={statsLoading} onSelectSection={setActiveSection} />
              {canCalendar && <CalendarMonthView onChange={handleCalendarChange} readOnly={!can('calendar', 'edit')} />}
              {canTasks && <TaskBoard tasksHook={tasksHook} readOnly={!can('tasks', 'edit')} />}
              {canContacts && <ContactsTable contactsHook={contactsHook} readOnly={!can('contacts', 'edit')} />}
              {canProjects && <ProjectsPanel readOnly={!can('projects', 'edit')} />}
              {canProjects && <GeneralDocumentsPanel readOnly={!can('projects', 'edit')} />}
              {canCosts && <CostsPanel readOnly={!can('costs', 'edit')} />}
              {canAgenda && <AgendaPanel readOnly={!can('agenda', 'edit')} />}
              {canFeedback && <FeedbackPanel />}
            </>
          ) : (
            <>
              {activeSection === 'calendar' && canCalendar && (
                <CalendarMonthView onChange={handleCalendarChange} readOnly={!can('calendar', 'edit')} />
              )}
              {activeSection === 'tasks' && canTasks && (
                <TaskBoard tasksHook={tasksHook} readOnly={!can('tasks', 'edit')} />
              )}
              {activeSection === 'contacts' && canContacts && (
                <ContactsTable contactsHook={contactsHook} readOnly={!can('contacts', 'edit')} />
              )}
              {activeSection === 'projects' && canProjects && <ProjectsPanel readOnly={!can('projects', 'edit')} />}
              {activeSection === 'documents' && canProjects && (
                <GeneralDocumentsPanel readOnly={!can('projects', 'edit')} />
              )}
              {activeSection === 'costs' && canCosts && <CostsPanel readOnly={!can('costs', 'edit')} />}
              {activeSection === 'mail' && canMail && (
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
              {activeSection === 'agenda' && canAgenda && <AgendaPanel readOnly={!can('agenda', 'edit')} />}
              {activeSection === 'feedback' && canFeedback && <FeedbackPanel />}
              {activeSection === 'invoices' && canInvoices && <InvoicesPanel readOnly={!can('invoices', 'edit')} />}
              {activeSection === 'admin' && canAdmin && <AdminPanel />}
            </>
          )
        ) : (
          <PendingApproval />
        )}
      </div>

      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
