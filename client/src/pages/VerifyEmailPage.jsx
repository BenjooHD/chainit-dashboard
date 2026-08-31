import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiPost } from '../api/client';
import './Auth.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('checking'); // checking | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Kein Verifizierungs-Token gefunden.');
      return;
    }
    apiPost('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-title">ChainIt Dashboard</span>
        </div>
        {status === 'checking' && <p>Bestätige E-Mail-Adresse…</p>}
        {status === 'success' && (
          <>
            <p>Deine E-Mail-Adresse wurde bestätigt. Du kannst dich jetzt anmelden.</p>
            <ButtonLink />
          </>
        )}
        {status === 'error' && (
          <>
            <div className="form-error">{error}</div>
            <ButtonLink />
          </>
        )}
      </div>
    </div>
  );
}

function ButtonLink() {
  return (
    <div className="auth-switch">
      <Link to="/login">Zum Login</Link>
    </div>
  );
}
