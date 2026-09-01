import { useState } from 'react';
import { useCosts } from '../../hooks/useCosts';
import CostFormModal from './CostFormModal';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import './Costs.css';

function formatAmount(n) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export default function CostsPanel({ readOnly = false }) {
  const { costs, loading, create, update, remove } = useCosts();
  const [editingCost, setEditingCost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const total = costs.reduce((sum, c) => sum + c.amount, 0);

  const handleSave = async (payload) => {
    if (editingCost) {
      await update(editingCost.id, payload);
    } else {
      await create(payload);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Kosten</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a className="btn btn-secondary" href="/api/costs/export.csv" download>
            CSV Export
          </a>
          {!readOnly && <Button onClick={() => setShowCreate(true)}>+ Kosten</Button>}
        </div>
      </div>

      {!loading && costs.length > 0 && (
        <div className="costs-total">
          Summe: <strong>{formatAmount(total)} €</strong>
        </div>
      )}

      {!loading && costs.length === 0 && <div className="task-empty">Noch keine Kosten erfasst</div>}

      {!loading && costs.length > 0 && (
        <div className="costs-table-wrap">
          <table className="costs-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Kategorie</th>
                <th>Datum</th>
                <th className="costs-table-amount">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((c) => (
                <tr
                  key={c.id}
                  onClick={readOnly ? undefined : () => setEditingCost(c)}
                  style={readOnly ? { cursor: 'default' } : undefined}
                >
                  <td>{c.title}</td>
                  <td>{c.category || '–'}</td>
                  <td>{formatDate(c.date)}</td>
                  <td className="costs-table-amount">{formatAmount(c.amount)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showCreate || editingCost) && (
        <CostFormModal
          cost={editingCost}
          onClose={() => {
            setShowCreate(false);
            setEditingCost(null);
          }}
          onSave={handleSave}
          onDelete={(id) => {
            setPendingDelete(id);
            setEditingCost(null);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Kosten löschen"
          message="Diesen Eintrag wirklich löschen?"
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
