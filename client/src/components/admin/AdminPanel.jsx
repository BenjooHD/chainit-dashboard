import { useAdminUsers } from '../../hooks/useAdminUsers';
import AdminUserRow from './AdminUserRow';
import './Admin.css';

export default function AdminPanel() {
  const { users, loading, error, update } = useAdminUsers();

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Team verwalten</h2>
      </div>
      {loading && <div className="task-empty">Lädt…</div>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nutzer</th>
                <th>Titel</th>
                <th>Kalender</th>
                <th>Aufgaben</th>
                <th>Kontakte</th>
                <th>Projekte</th>
                <th>Mail</th>
                <th>Besprechung</th>
                <th>Kosten</th>
                <th>Rolle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <AdminUserRow key={u.id} user={u} onSave={update} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
