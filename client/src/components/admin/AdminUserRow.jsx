import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const AREAS = [
  { key: 'calendar', label: 'Kalender' },
  { key: 'tasks', label: 'Aufgaben' },
  { key: 'contacts', label: 'Kontakte' },
  { key: 'projects', label: 'Projekte' },
  { key: 'mail', label: 'Mail' },
  { key: 'agenda', label: 'Besprechung' },
  { key: 'costs', label: 'Kosten' },
];

export default function AdminUserRow({ user, onSave }) {
  const { user: me } = useAuth();
  const [title, setTitle] = useState(user.title || '');
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [perms, setPerms] = useState(user.permissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const isSelf = user.id === me.id;

  const togglePerm = (area, level) => {
    setPerms((prev) => {
      const current = prev[area];
      const next = { ...current, [level]: !current[level] };
      if (level === 'edit' && next.edit) next.view = true; // edit implies view
      if (level === 'view' && !next.view) next.edit = false; // no view -> no edit
      return { ...prev, [area]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave(user.id, { title, isAdmin, permissions: perms });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td>
        <div className="admin-user-name">{user.username}</div>
        <div className="admin-user-email">{user.email}</div>
      </td>
      <td>
        <input
          className="admin-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Vertrieb"
        />
      </td>
      {AREAS.map((a) => (
        <td key={a.key} className="admin-perm-cell">
          <label className="admin-perm-check">
            <input
              type="checkbox"
              checked={isAdmin || perms[a.key].view}
              disabled={isAdmin}
              onChange={() => togglePerm(a.key, 'view')}
            />
            sehen
          </label>
          <label className="admin-perm-check">
            <input
              type="checkbox"
              checked={isAdmin || perms[a.key].edit}
              disabled={isAdmin}
              onChange={() => togglePerm(a.key, 'edit')}
            />
            bearbeiten
          </label>
        </td>
      ))}
      <td>
        <label className="admin-perm-check">
          <input
            type="checkbox"
            checked={isAdmin}
            disabled={isSelf}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          Admin
        </label>
      </td>
      <td>
        <button className="admin-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? '…' : saved ? '✓' : 'Speichern'}
        </button>
        {error && <div className="admin-row-error">{error}</div>}
      </td>
    </tr>
  );
}
