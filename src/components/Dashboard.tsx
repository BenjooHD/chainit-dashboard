'use client';

import { useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTask } from '@/context/TaskContext';
import { useRouter } from 'next/navigation';
import Header from './layout/Header';
import QuickNav from './layout/QuickNav';
import TasksView from './views/TasksView';
import DashboardView from './views/DashboardView';
import KanbanView from './views/KanbanView';
import BrainstormingView from './views/BrainstormingView';
import { isOverdue } from '@/lib/taskUtils';

type TabType = 'dashboard' | 'kanban' | 'tasks' | 'brainstorming';

const TABS: { key: TabType; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'kanban', label: 'Kanban Board' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'brainstorming', label: 'Brainstorming' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { user, signOut } = useAuth();
  const { tasks } = useTask();
  const router = useRouter();
  const layoutRef = useRef<HTMLDivElement>(null);

  const overdueTasks = useMemo(
    () => tasks.filter(isOverdue).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks]
  );
  const highPriorityTasks = useMemo(
    () => tasks.filter(t => t.priority === 'high' && t.status !== 'completed' && !isOverdue(t)),
    [tasks]
  );

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const goHome = () => {
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Header
        user={user}
        overdueTasks={overdueTasks}
        highPriorityTasks={highPriorityTasks}
        onJumpToUrgent={goHome}
        onLogoClick={goHome}
        onLogout={handleLogout}
      />
      <QuickNav
        sections={TABS.map(t => ({
          ...t,
          active: activeTab === t.key,
          onClick: () => setActiveTab(t.key),
        }))}
      />
      <div className="dashboard-layout" ref={layoutRef}>
        {activeTab === 'dashboard' && (
          <DashboardView
            overdueTasks={overdueTasks}
            highPriorityTasks={highPriorityTasks}
            onSelectTab={setActiveTab}
          />
        )}
        {activeTab === 'kanban' && <KanbanView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'brainstorming' && <BrainstormingView />}
      </div>
    </div>
  );
}
