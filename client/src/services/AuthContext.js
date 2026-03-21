import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ags_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('ags_session'));

  const logout = useCallback(async (silent = false) => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('ags_token');
    localStorage.removeItem('ags_user');
    localStorage.removeItem('ags_session');
    setUser(null);
    setSessionId(null);
    if (!silent) toast.success('Logged out successfully');
  }, []);

  useEffect(() => {
    const handleAutoLogout = () => logout(true);
    window.addEventListener('auth:logout', handleAutoLogout);
    return () => window.removeEventListener('auth:logout', handleAutoLogout);
  }, [logout]);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('ags_token');
      if (!token) { setLoading(false); return; }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('ags_user', JSON.stringify(res.data.user));
      } catch {
        localStorage.removeItem('ags_token');
        localStorage.removeItem('ags_user');
        localStorage.removeItem('ags_session');
        setUser(null);
      } finally { setLoading(false); }
    };
    verify();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData, sessionId: sid } = res.data;
    localStorage.setItem('ags_token', token);
    localStorage.setItem('ags_user', JSON.stringify(userData));
    localStorage.setItem('ags_session', sid);
    setUser(userData);
    setSessionId(sid);
    return userData;
  };

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isTeacher, sessionId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
