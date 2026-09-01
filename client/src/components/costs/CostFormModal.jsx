import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function CostFormModal({ cost, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(cost?.title || '');
  const [amount, setAmount] = useState(cost?.amount != null ? String(cost.amount) : '');
  const [category, setCategory] = useState(cost?.category || '');
  const [date, setDate] = useState(cost?.date || '');
  const [status, setStatus] = useState(cost?.status || 'ausgabe');
  const [notes, setNotes] = useState(cost?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Titel ist erforderlich');
      return;
    }
    const numAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(numAmount)) {
      setError('Betrag muss eine Zahl sein');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        amount: numAmount,
        category: category.trim() || null,
        date: date || null,
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={cost ? 'Kosten bearbeiten' : 'Neue Kosten'}
      onClose={onClose}
      footer={
        <>
          {cost ? (
            <Button variant="danger" type="button" onClick={() => onDelete(cost.id)}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="cost-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form id="cost-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Titel
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label>
          Betrag (€)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" />
        </label>
        <label>
          Kategorie
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Software, Büro, Reisen" />
        </label>
        <label>
          Datum
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Status
          <div className="priority-btn-group">
            <button
              type="button"
              className={`priority-btn ${status === 'geplant' ? 'priority-btn-active priority-btn-medium' : ''}`}
              onClick={() => setStatus('geplant')}
            >
              Geplant
            </button>
            <button
              type="button"
              className={`priority-btn ${status === 'ausgabe' ? 'priority-btn-active priority-btn-low' : ''}`}
              onClick={() => setStatus('ausgabe')}
            >
              Ausgabe (bezahlt)
            </button>
          </div>
        </label>
        <label>
          Notizen
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
