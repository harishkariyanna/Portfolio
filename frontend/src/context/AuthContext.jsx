import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as loginApi, logout as logoutApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await getMe();
      setAdmin(data.admin);
    } catch (error) {
      // Silently handle - user is just not logged in
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    const handler = () => { setAdmin(null); setLoading(false); };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await loginApi(email, password);
    setAdmin(data.admin);
    return data;
  };

  const logout = async () => {
    await logoutApi();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
