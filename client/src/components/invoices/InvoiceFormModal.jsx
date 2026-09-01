import { useEffect, useState } from 'react';
import Button from '../common/Button';

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysStr(base, days) {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyItem() {
  return { description: '', quantity: 1, unitPrice: 0 };
}

export default function InvoiceFormModal({ invoice, settings, onClose, onSave, onDelete }) {
  const [customerName, setCustomerName] = useState(invoice?.customerName || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customerAddress || '');
  const [issueDate, setIssueDate] = useState(invoice?.issueDate || todayStr());
  const [serviceDate, setServiceDate] = useState(invoice?.serviceDate || '');
  const [dueDate, setDueDate] = useState(invoice?.dueDate || addDaysStr(todayStr(), 14));
  const [vatMode, setVatMode] = useState(invoice?.vatMode || (settings?.vatMode === 'kleinunternehmer' ? 'kleinunternehmer' : 'standard'));
  const [vatRate, setVatRate] = useState(invoice?.vatRate ?? settings?.defaultVatRate ?? 19);
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [items, setItems] = useState(
    invoice?.items?.length ? invoice.items.map((it) => ({ ...it })) : [emptyItem()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
  const vatAmount = vatMode === 'kleinunternehmer' ? 0 : subtotal * (Number(vatRate || 0) / 100);
  const total = subtotal + vatAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Kundenname ist erforderlich');
      return;
    }
    const cleanItems = items.filter((it) => it.description.trim());
    if (cleanItems.length === 0) {
      setError('Mindestens eine Position ist erforderlich');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim() || null,
        issueDate,
        serviceDate: serviceDate || null,
        dueDate: dueDate || null,
        vatMode,
        vatRate: Number(vatRate),
        notes: notes.trim() || null,
        items: cleanItems.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="invoice-form-panel">
        <div className="modal-header">
          <h3>{invoice ? `Rechnung ${invoice.invoiceNumber} bearbeiten` : 'Neue Rechnung'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">
            &times;
          </button>
        </div>
        <form id="invoice-form" onSubmit={handleSubmit} className="invoice-form-body">
          {error && <div className="form-error">{error}</div>}

          <div className="invoice-form-grid">
            <label>
              Kunde / Firma
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus />
            </label>
            <label>
              Rechnungsdatum
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </label>
            <label className="invoice-form-span2">
              Kundenadresse
              <textarea rows={2} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
            </label>
            <label>
              Leistungsdatum
              <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </label>
            <label>
              Fällig am
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label>
              USt-Modus
              <select value={vatMode} onChange={(e) => setVatMode(e.target.value)}>
                <option value="standard">Regelbesteuerung</option>
                <option value="kleinunternehmer">Kleinunternehmer (§19 UStG)</option>
              </select>
            </label>
            {vatMode === 'standard' && (
              <label>
                USt-Satz (%)
                <input type="number" step="0.1" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
              </label>
            )}
          </div>

          <div className="invoice-items">
            <div className="invoice-items-header">
              <span>Beschreibung</span>
              <span>Menge</span>
              <span>Einzelpreis</span>
              <span>Gesamt</span>
              <span />
            </div>
            {items.map((it, i) => (
              <div className="invoice-item-row" key={i}>
                <input
                  placeholder="Leistung / Produkt"
                  value={it.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                />
                <span className="invoice-item-total">
                  {(Number(it.quantity || 0) * Number(it.unitPrice || 0)).toFixed(2)} €
                </span>
                <button type="button" className="documents-item-delete" onClick={() => removeItem(i)} title="Entfernen">
                  ✕
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addItem}>
              + Position
            </Button>
          </div>

          <div className="invoice-totals">
            <div className="totals-row">
              <span>Zwischensumme</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            {vatMode !== 'kleinunternehmer' && (
              <div className="totals-row">
                <span>USt ({vatRate}%)</span>
                <span>{vatAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="totals-row totals-row-final">
              <span>Gesamtbetrag</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <label>
            Notizen (erscheinen auf der Rechnung)
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </form>
        <div className="modal-footer">
          {invoice ? (
            <Button variant="danger" type="button" onClick={() => onDelete(invoice.id)}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="invoice-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
