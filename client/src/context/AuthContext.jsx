import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

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

  const register = useCallback(async (username, password) => {
    const u = await apiPost('/auth/register', { username, password });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
