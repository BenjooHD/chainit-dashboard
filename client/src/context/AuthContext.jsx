import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const u = await apiPost('/auth/login', { username, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (username, email, password) => {
    // Does not log the user in — the account is inactive until the email is verified.
    return apiPost('/auth/register', { username, email, password });
  }, []);

  const resendVerification = useCallback(async (username, password) => {
    return apiPost('/auth/resend-verification', { username, password });
  }, []);

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    setUser(null);
  }, []);

  const updateAccount = useCallback(async ({ currentPassword, newUsername, newPassword }) => {
    const u = await apiPatch('/auth/me', { currentPassword, newUsername, newPassword });
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, resendVerification, updateAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
