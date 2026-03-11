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
  isImpersonating: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: FormData) => Promise<{ warning?: string }>;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vdmt_token'));
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(() => !!localStorage.getItem('vdmt_original_token'));

  useEffect(() => {
    if (token) {
      api.setToken(token);
      api.get<{ user: User }>('/auth/me')
        .then(({ user }) => setUser(user))
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('vdmt_token');
          localStorage.removeItem('vdmt_original_token');
          setIsImpersonating(false);
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (identifier: string, password: string) => {
    const { user, token: newToken } = await api.post<{ user: User; token: string }>('/auth/login', { identifier, password });
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
    setIsImpersonating(false);
    localStorage.removeItem('vdmt_token');
    localStorage.removeItem('vdmt_original_token');
    api.setToken(null);
  }, []);

  const updateProfile = useCallback(async (formData: FormData): Promise<{ warning?: string }> => {
    const { user: updated, warning } = await api.upload<{ user: User; warning?: string }>('/auth/profile', formData, 'PUT');
    setUser(updated);
    return { warning };
  }, []);

  const impersonate = useCallback(async (userId: string) => {
    const { user: targetUser, token: newToken } = await api.post<{ user: User; token: string }>(`/auth/impersonate/${userId}`);
    // Save admin credentials
    localStorage.setItem('vdmt_original_token', token!);
    // Switch to impersonated user
    setToken(newToken);
    setUser(targetUser);
    setIsImpersonating(true);
    localStorage.setItem('vdmt_token', newToken);
    api.setToken(newToken);
  }, [token]);

  const stopImpersonating = useCallback(() => {
    const savedToken = localStorage.getItem('vdmt_original_token');
    if (savedToken) {
      setToken(savedToken);
      api.setToken(savedToken);
      localStorage.setItem('vdmt_token', savedToken);
      localStorage.removeItem('vdmt_original_token');
      setIsImpersonating(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, isImpersonating, login, register, logout, updateProfile, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
