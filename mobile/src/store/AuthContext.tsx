import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { secureStore } from '../utils/secureStore';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, code: string, password: string, name?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, token: null, isLoading: true, isAuthenticated: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await secureStore.getToken();
        const user = await secureStore.getUser<User>();
        if (token && user) {
          setState({ user, token, isLoading: false, isAuthenticated: true });
        } else {
          setState(s => ({ ...s, isLoading: false }));
        }
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await authApi.login(phone, password);
    if (!res.data.success || !res.data.data) throw new Error(res.data.error || 'Login failed');
    const { token, ...user } = res.data.data;
    const userObj = user as unknown as User;
    await secureStore.setToken(token);
    await secureStore.setUser(userObj);
    setState({ user: userObj, token, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (phone: string, code: string, password: string, name?: string, role?: string) => {
    const res = await authApi.register({ phone, code, password, name, role });
    if (!res.data.success || !res.data.data) throw new Error(res.data.error || 'Register failed');
    const { token, ...user } = res.data.data;
    const userObj = user as unknown as User;
    await secureStore.setToken(token);
    await secureStore.setUser(userObj);
    setState({ user: userObj, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await secureStore.clear();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
