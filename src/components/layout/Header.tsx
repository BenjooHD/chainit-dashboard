'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from '@/context/AuthContext';
import type { Task } from '@/context/TaskContext';

function truncate(text: string, max = 20) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface HeaderProps {
  user: User | null;
  overdueTasks: Task[];
  highPriorityTasks: Task[];
  onJumpToUrgent: () => void;
  onLogoClick: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  overdueTasks,
  highPriorityTasks,
  onJumpToUrgent,
  onLogoClick,
  onLogout,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const displayName = user?.name || user?.email?.split('@')[0] || '';
  const topOverdue = overdueTasks[0];
  const topHigh = highPriorityTasks[0];

  return (
    <header className="header">
      <button className="header-brand" onClick={onLogoClick} title="Home">
        <img src="/logo-mark.png" alt="ChainIt" className="header-logo-mark" />
        <div>
          <div className="header-title">ChainIt</div>
          <div className="header-subtitle">Dashboard</div>
        </div>
      </button>

      {(topOverdue || topHigh) && (
        <button className="header-urgent" onClick={onJumpToUrgent}>
          {topOverdue && (
            <span className="header-urgent-badge header-urgent-badge-danger">
              ⚠ {truncate(topOverdue.title)}
              {overdueTasks.length > 1 && ` +${overdueTasks.length - 1}`}
            </span>
          )}
          {topHigh && (
            <span className="header-urgent-badge">
              ✓ {truncate(topHigh.title)}
              {highPriorityTasks.length > 1 && ` +${highPriorityTasks.length - 1}`}
            </span>
          )}
        </button>
      )}

      <div className="header-right">
        <div className="header-account" ref={accountRef}>
          <button className="account-trigger" onClick={() => setOpen(o => !o)}>
            <span className="account-avatar">{displayName[0]?.toUpperCase() ?? '?'}</span>
            <span className="account-name">{displayName}</span>
          </button>

          {open && (
            <div className="account-panel">
              <div className="account-panel-name">{displayName}</div>
              {user?.email && <div className="account-panel-title">{user.email}</div>}
              <button className="account-logout" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
