import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AccountSettingsModal from './AccountSettingsModal';
import './Header.css';

function ChainItLogo() {
  return <img src="/logo-mark.png" alt="ChainIt" className="header-logo-mark" />;
}

export default function Header({ overdueCount = 0, importantEventCount = 0, upcomingTaskCount = 0, onJumpToUrgent }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasUrgent = overdueCount > 0 || importantEventCount > 0 || upcomingTaskCount > 0;

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
          {overdueCount > 0 && (
            <span className="header-urgent-badge header-urgent-badge-danger">
              {overdueCount} überfällig
            </span>
          )}
          {importantEventCount > 0 && (
            <span className="header-urgent-badge header-urgent-badge-danger">
              {importantEventCount} wichtig · 5 Tage
            </span>
          )}
          {upcomingTaskCount > 0 && (
            <span className="header-urgent-badge">{upcomingTaskCount} fällig · 5 Tage</span>
          )}
        </button>
      )}

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

      {showSettings && <AccountSettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
}
