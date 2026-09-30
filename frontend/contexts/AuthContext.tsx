'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string; idCardNumber?: string; emergencyContact?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken) {
      await authApi.logout(accessToken, refreshToken || '').catch(() => {});
    }
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    window.location.href = '/login';
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { setLoading(false); return; }

      try {
        if (!refreshPromise) {
          refreshPromise = authApi.refresh(refreshToken);
        }
        const { accessToken: newToken, refreshToken: newRefreshToken } = await refreshPromise;
        if (!isMounted) return;
        
        const me = await authApi.me(newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        setAccessToken(newToken);
        setUser(me);
      } catch (err) {
        if (!isMounted) return;
        localStorage.removeItem('refreshToken');
      } finally {
        refreshPromise = null;
        if (isMounted) setLoading(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('refreshToken', res.refreshToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; role?: string; idCardNumber?: string; emergencyContact?: string }) => {
    const res = await authApi.register(data);
    localStorage.setItem('refreshToken', res.refreshToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const updateUser = (updated: User) => setUser(updated);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
