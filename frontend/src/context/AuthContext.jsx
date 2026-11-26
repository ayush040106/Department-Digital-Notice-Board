import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('noticeboard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((userData, token) => {
    if (token) {
      localStorage.setItem('noticeboard_token', token);
    }
    if (userData) {
      localStorage.setItem('noticeboard_user', JSON.stringify(userData));
      setUser(userData);
    } else {
      localStorage.removeItem('noticeboard_token');
      localStorage.removeItem('noticeboard_user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('noticeboard_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        syncUser(res.data.data.user);
      } catch {
        syncUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [syncUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedUser } = res.data.data;
    syncUser(loggedUser, token);
    return loggedUser;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token, user: registeredUser } = res.data.data;
    syncUser(registeredUser, token);
    return registeredUser;
  };

  const updateProfile = async (payload) => {
    const res = await api.put('/auth/profile', payload);
    const updatedUser = res.data.data.user;
    syncUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    syncUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
};
