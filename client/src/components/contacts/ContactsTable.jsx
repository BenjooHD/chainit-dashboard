import { useState } from 'react';
import ContactFormModal from './ContactFormModal';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import './Contacts.css';

export default function ContactsTable({ contactsHook }) {
  const { contacts, create, update, remove } = contactsHook;
  const [editingContact, setEditingContact] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleSave = async (payload) => {
    if (editingContact) {
      await update(editingContact.id, payload);
    } else {
      await create(payload);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Kontakte</h2>
        <Button onClick={() => setShowCreate(true)}>+ Kontakt</Button>
      </div>

      {contacts.length === 0 ? (
        <div className="task-empty">Noch keine Kontakte</div>
      ) : (
        <div className="contacts-table-wrap">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Firma</th>
                <th>E-Mail</th>
                <th>Telefon</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} onClick={() => setEditingContact(c)}>
                  <td>{c.fullName}</td>
                  <td>{c.company || '–'}</td>
                  <td>{c.email || '–'}</td>
                  <td>{c.phone || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showCreate || editingContact) && (
        <ContactFormModal
          contact={editingContact}
          onClose={() => {
            setShowCreate(false);
            setEditingContact(null);
          }}
          onSave={handleSave}
          onDelete={(id) => {
            setPendingDelete(id);
            setEditingContact(null);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Kontakt löschen"
          message="Diesen Kontakt wirklich löschen?"
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
