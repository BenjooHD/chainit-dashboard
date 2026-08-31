import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-title">ChainIt Dashboard</span>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <label>
            Benutzername
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </label>
          <label>
            Passwort
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>
        <div className="auth-switch">
          Noch kein Account? <Link to="/register">Jetzt registrieren</Link>
        </div>
      </div>
    </div>
  );
}
