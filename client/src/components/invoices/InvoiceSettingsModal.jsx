import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function InvoiceSettingsModal({ settings, onClose, onSave }) {
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [vatMode, setVatMode] = useState(settings.vatMode === 'unset' ? 'standard' : settings.vatMode);
  const [defaultVatRate, setDefaultVatRate] = useState(settings.defaultVatRate ?? 19);
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [bankIban, setBankIban] = useState(settings.bankIban || '');
  const [bankBic, setBankBic] = useState(settings.bankBic || '');
  const [footerNote, setFooterNote] = useState(settings.footerNote || '');
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || 'RE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        companyName: companyName.trim() || null,
        companyAddress: companyAddress.trim() || null,
        taxId: taxId.trim() || null,
        vatMode,
        defaultVatRate: Number(defaultVatRate),
        bankName: bankName.trim() || null,
        bankIban: bankIban.trim() || null,
        bankBic: bankBic.trim() || null,
        footerNote: footerNote.trim() || null,
        invoicePrefix: invoicePrefix.trim() || 'RE',
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
      title="Rechnungseinstellungen"
      onClose={onClose}
      footer={
        <>
          <span />
          <Button type="submit" form="invoice-settings-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form
        id="invoice-settings-form"
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
      >
        {error && <div className="form-error">{error}</div>}
        <label>
          Firmenname
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="ChainIt Technologies" />
        </label>
        <label>
          Firmenadresse
          <textarea rows={2} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
        </label>
        <label>
          Steuernummer / USt-IdNr.
          <input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        </label>
        <label>
          Umsatzsteuer-Modus (Standard für neue Rechnungen)
          <select value={vatMode} onChange={(e) => setVatMode(e.target.value)}>
            <option value="standard">Regelbesteuerung</option>
            <option value="kleinunternehmer">Kleinunternehmer (§19 UStG)</option>
          </select>
        </label>
        <label>
          Standard-USt-Satz (%)
          <input type="number" step="0.1" value={defaultVatRate} onChange={(e) => setDefaultVatRate(e.target.value)} />
        </label>
        <label>
          Rechnungsnummer-Präfix
          <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="RE" />
        </label>
        <label>
          Bank
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </label>
        <label>
          IBAN
          <input value={bankIban} onChange={(e) => setBankIban(e.target.value)} />
        </label>
        <label>
          BIC
          <input value={bankBic} onChange={(e) => setBankBic(e.target.value)} />
        </label>
        <label>
          Fußzeilen-Hinweis (auf jeder Rechnung)
          <textarea rows={2} value={footerNote} onChange={(e) => setFooterNote(e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
