import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInvoices, useInvoice, useInvoiceSettings } from '../../hooks/useInvoices';
import InvoiceFormModal from './InvoiceFormModal';
import InvoiceSettingsModal from './InvoiceSettingsModal';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import './Invoices.css';

const STATUS_LABELS = { offen: 'Offen', bezahlt: 'Bezahlt', storniert: 'Storniert' };

function formatMoney(n) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export default function InvoicesPanel({ readOnly = false }) {
  const { user } = useAuth();
  const { invoices, loading, create, update, setStatus, remove } = useInvoices();
  const { settings, update: updateSettings } = useInvoiceSettings();
  const [editingId, setEditingId] = useState(null);
  const { invoice: editingInvoice } = useInvoice(editingId);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleSave = async (payload) => {
    if (editingId) {
      await update(editingId, payload);
    } else {
      await create(payload);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Rechnungen</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user?.isAdmin && (
            <Button variant="secondary" onClick={() => setShowSettings(true)}>
              Einstellungen
            </Button>
          )}
          {!readOnly && <Button onClick={() => setShowCreate(true)}>+ Rechnung</Button>}
        </div>
      </div>

      {settings?.vatMode === 'unset' && user?.isAdmin && (
        <div className="task-empty">
          Noch kein USt-Modus festgelegt — unter "Einstellungen" bitte auswählen, bevor ihr die erste Rechnung
          verschickt.
        </div>
      )}

      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && invoices.length === 0 && <div className="task-empty">Noch keine Rechnungen</div>}

      {!loading && invoices.length > 0 && (
        <div className="costs-table-wrap">
          <table className="costs-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Kunde</th>
                <th>Datum</th>
                <th>Fällig</th>
                <th>Status</th>
                <th className="costs-table-amount">Betrag</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td onClick={() => setEditingId(inv.id)} style={{ cursor: 'pointer' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td onClick={() => setEditingId(inv.id)} style={{ cursor: 'pointer' }}>
                    {inv.customerName}
                  </td>
                  <td onClick={() => setEditingId(inv.id)} style={{ cursor: 'pointer' }}>
                    {formatDate(inv.issueDate)}
                  </td>
                  <td onClick={() => setEditingId(inv.id)} style={{ cursor: 'pointer' }}>
                    {formatDate(inv.dueDate)}
                  </td>
                  <td>
                    {readOnly ? (
                      <span className={`invoice-status-badge invoice-status-${inv.status}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    ) : (
                      <select value={inv.status} onChange={(e) => setStatus(inv.id, e.target.value)}>
                        <option value="offen">Offen</option>
                        <option value="bezahlt">Bezahlt</option>
                        <option value="storniert">Storniert</option>
                      </select>
                    )}
                  </td>
                  <td className="costs-table-amount">{formatMoney(inv.total)} €</td>
                  <td>
                    <a
                      className="btn btn-secondary"
                      href={`/api/invoices/${inv.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showCreate || editingInvoice) && (
        <InvoiceFormModal
          invoice={editingInvoice}
          settings={settings}
          onClose={() => {
            setShowCreate(false);
            setEditingId(null);
          }}
          onSave={handleSave}
          onDelete={(id) => {
            setPendingDelete(id);
            setEditingId(null);
          }}
        />
      )}

      {showSettings && settings && (
        <InvoiceSettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={updateSettings}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Rechnung löschen"
          message="Diese Rechnung wirklich löschen? Für bereits verschickte Rechnungen besser den Status 'Storniert' setzen, um die Nummerierung lückenlos zu halten."
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </section>
  );
}
