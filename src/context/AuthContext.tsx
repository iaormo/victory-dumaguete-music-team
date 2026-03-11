/**
 * Authentication Context
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vdmt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.setToken(token);
      api.get<{ user: User }>('/auth/me')
        .then(({ user }) => setUser(user))
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('vdmt_token');
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token: newToken } = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    setToken(newToken);
    setUser(user);
    localStorage.setItem('vdmt_token', newToken);
    api.setToken(newToken);
  }, []);

  const register = useCallback(async (formData: FormData) => {
    const { user, token: newToken } = await api.upload<{ user: User; token: string }>('/auth/register', formData);
    setToken(newToken);
    setUser(user);
    localStorage.setItem('vdmt_token', newToken);
    api.setToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('vdmt_token');
    api.setToken(null);
  }, []);

  const updateProfile = useCallback(async (formData: FormData) => {
    const { user: updated } = await api.upload<{ user: User }>('/auth/profile', formData, 'PUT');
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
