import { useRef, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useClickOutside } from '../../hooks/useClickOutside';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.floor(hours / 24)} Tg.`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  const handleToggle = () => {
    setOpen((o) => {
      if (!o && unreadCount > 0) markAllRead();
      return !o;
    });
  };

  return (
    <div className="header-notif" ref={containerRef}>
      <button className="header-notif-trigger" onClick={handleToggle} title="Benachrichtigungen">
        🔔
        {unreadCount > 0 && <span className="header-notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="header-notif-panel">
          {notifications.length === 0 && <div className="task-empty">Keine Benachrichtigungen</div>}
          {notifications.map((n) => (
            <div key={n.id} className="header-notif-item">
              <div>{n.message}</div>
              <div className="header-notif-time">{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
