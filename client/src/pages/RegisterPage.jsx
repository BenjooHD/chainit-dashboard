import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register(username, email, password);
      setSentTo(res.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-title">ChainIt Dashboard</span>
          </div>
          <p>
            Wir haben eine Bestätigungs-Mail an <strong>{sentTo}</strong> gesendet. Klicke auf den Link
            darin, um dein Konto zu aktivieren.
          </p>
          <div className="auth-switch">
            <Link to="/login">Zurück zum Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-title">ChainIt Dashboard</span>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <label>
            Benutzername (mind. 3 Zeichen)
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              autoFocus
              required
            />
          </label>
          <label>
            E-Mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Passwort (mind. 8 Zeichen)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Registrieren…' : 'Account erstellen'}
          </Button>
        </form>
        <div className="auth-switch">
          Schon einen Account? <Link to="/login">Jetzt anmelden</Link>
        </div>
      </div>
    </div>
  );
}
