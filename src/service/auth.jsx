import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. If URL carries a token (?token=...), save it and strip
    const qs     = new URLSearchParams(window.location.search);
    const qToken = qs.get('token');
    if (qToken) {
      localStorage.setItem('token', qToken);
      qs.delete('token');
      const clean = window.location.pathname + (qs.toString() ? `?${qs}` : '');
      window.history.replaceState({}, '', clean);
    }

    // 2. Restore
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');
    if (storedToken) {
      setToken(storedToken);
      try {
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const setAuthToken = (newToken, newUser = null) => {
    localStorage.setItem('token', newToken);
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    setAuthToken,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};