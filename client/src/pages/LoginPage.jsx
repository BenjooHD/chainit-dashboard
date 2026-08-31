import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import './Auth.css';

export default function LoginPage() {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setResendStatus(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
      if (err.code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      await resendVerification(username, password);
      setResendStatus('sent');
    } catch (err) {
      setResendStatus(null);
      setError(err.message);
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
          {needsVerification && (
            <div className="form-hint">
              {resendStatus === 'sent' ? (
                'Neue Bestätigungs-Mail wurde gesendet.'
              ) : (
                <>
                  Bitte bestätige zuerst deine E-Mail-Adresse.{' '}
                  <button type="button" className="link-button" onClick={handleResend} disabled={resendStatus === 'sending'}>
                    {resendStatus === 'sending' ? 'Sende…' : 'E-Mail erneut senden'}
                  </button>
                </>
              )}
            </div>
          )}
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
