import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ContactFormModal({ contact, onClose, onSave, onDelete }) {
  const [fullName, setFullName] = useState(contact?.fullName || '');
  const [company, setCompany] = useState(contact?.company || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [notes, setNotes] = useState(contact?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Name ist erforderlich');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        fullName: fullName.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
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
      title={contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
      onClose={onClose}
      footer={
        <>
          {contact ? (
            <Button variant="danger" type="button" onClick={() => onDelete(contact.id)}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="contact-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form id="contact-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        </label>
        <label>
          Firma
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
        <label>
          E-Mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Telefon
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Notizen
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
