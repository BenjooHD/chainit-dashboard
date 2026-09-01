import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AccountSettingsModal from './AccountSettingsModal';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';
import './Header.css';

function ChainItLogo() {
  return <img src="/logo-mark.png" alt="ChainIt" className="header-logo-mark" />;
}

function truncate(text, max = 20) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function Header({ overdueTasks = [], importantEvents = [], upcomingTasks = [], onJumpToUrgent }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasUrgent = overdueTasks.length > 0 || importantEvents.length > 0 || upcomingTasks.length > 0;

  const topOverdue = overdueTasks[0];
  const topEvent = importantEvents[0];
  const topTask = upcomingTasks[0];

  return (
    <header className="header">
      <div className="header-brand">
        <ChainItLogo />
        <div>
          <div className="header-title">ChainIt</div>
          <div className="header-subtitle">Dashboard</div>
        </div>
      </div>

      {hasUrgent && (
        <button className="header-urgent" onClick={onJumpToUrgent}>
          {topOverdue && (
            <span className="header-urgent-badge header-urgent-badge-danger">
              ⚠ {truncate(topOverdue.title)}
              {overdueTasks.length > 1 && ` +${overdueTasks.length - 1}`}
            </span>
          )}
          {topEvent && (
            <span className="header-urgent-badge header-urgent-badge-danger">
              📅 {truncate(topEvent.title)}
              {importantEvents.length > 1 && ` +${importantEvents.length - 1}`}
            </span>
          )}
          {topTask && (
            <span className="header-urgent-badge">
              ✓ {truncate(topTask.title)}
              {upcomingTasks.length > 1 && ` +${upcomingTasks.length - 1}`}
            </span>
          )}
        </button>
      )}

      <div className="header-right">
        <SearchBar />
        <NotificationBell />

        <div className="header-account">
          <button className="account-trigger" onClick={() => setOpen((o) => !o)}>
            <span className="account-avatar">{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
            <span className="account-name">{user?.username}</span>
          </button>

          {open && (
            <div className="account-panel">
              <div className="account-panel-name">
                {user?.username}
                {user?.isAdmin && <span className="account-admin-badge">Admin</span>}
              </div>
              {user?.title && <div className="account-panel-title">{user.title}</div>}
              <button
                className="account-edit"
                onClick={() => {
                  setShowSettings(true);
                  setOpen(false);
                }}
              >
                Konto bearbeiten
              </button>
              <button className="account-logout" onClick={logout}>
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && <AccountSettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
}
