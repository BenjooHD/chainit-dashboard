import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

function ChainItLogo() {
  return <img src="/logo-mark.png" alt="ChainIt" className="header-logo-mark" />;
}

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-brand">
        <ChainItLogo />
        <div>
          <div className="header-title">ChainIt</div>
          <div className="header-subtitle">Dashboard</div>
        </div>
      </div>

      <div className="header-account">
        <button className="account-trigger" onClick={() => setOpen((o) => !o)}>
          <span className="account-avatar">{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
          <span className="account-name">{user?.username}</span>
        </button>

        {open && (
          <div className="account-panel">
            <div className="account-panel-name">{user?.username}</div>
            <button className="account-logout" onClick={logout}>
              Abmelden
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
