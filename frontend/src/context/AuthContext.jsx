import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const AuthContext = createContext(null);

const BASE = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { _id, name, email, token }
  const [loading, setLoading] = useState(true);   // resolving saved session

  // On mount — restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('authUser');
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (userData) => {
    setUser(userData);
    if (userData) localStorage.setItem('authUser', JSON.stringify(userData));
    else          localStorage.removeItem('authUser');
  };

  const register = useCallback(async (name, email, password) => {
    const { data } = await axios.post(`${BASE}/api/auth/register`, { name, email, password });
    persist(data.data);
    return data.data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(`${BASE}/api/auth/login`, { email, password });
    persist(data.data);
    return data.data;
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
