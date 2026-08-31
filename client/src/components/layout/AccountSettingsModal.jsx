import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export default function AccountSettingsModal({ onClose }) {
  const { user, updateAccount } = useAuth();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    const usernameChanged = newUsername.trim() && newUsername.trim() !== user.username;
    const passwordChanged = newPassword.length > 0;
    if (!usernameChanged && !passwordChanged) {
      setError('Ändere den Benutzernamen und/oder das Passwort, bevor du speicherst.');
      return;
    }
    if (passwordChanged && newPassword.length < 8) {
      setError('Neues Passwort muss mindestens 8 Zeichen haben.');
      return;
    }

    setSaving(true);
    try {
      await updateAccount({
        currentPassword,
        newUsername: usernameChanged ? newUsername.trim() : undefined,
        newPassword: passwordChanged ? newPassword : undefined,
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Konto bearbeiten"
      onClose={onClose}
      footer={
        <>
          <span />
          <Button type="submit" form="account-settings-form" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form
        id="account-settings-form"
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
      >
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-hint">Konto wurde aktualisiert.</div>}
        <label>
          Neuer Benutzername
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} minLength={3} />
        </label>
        <label>
          Neues Passwort (leer lassen, um es nicht zu ändern)
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            placeholder="mind. 8 Zeichen"
          />
        </label>
        <label>
          Aktuelles Passwort (zur Bestätigung)
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoFocus
          />
        </label>
      </form>
    </Modal>
  );
}
