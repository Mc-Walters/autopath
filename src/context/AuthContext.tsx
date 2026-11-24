import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, LoginPayload, RegisterPayload } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('apexparts_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (
          !parsed ||
          parsed.email === 'd.miller@apexmotors.com' ||
          parsed.id === 'usr-demo-01' ||
          parsed.fullName === 'David Miller'
        ) {
          localStorage.removeItem('apexparts_auth_user');
          localStorage.removeItem('apexparts_auth_token');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const savedUser = localStorage.getItem('apexparts_auth_user');
      if (!savedUser) return null;
      return localStorage.getItem('apexparts_auth_token') || null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('apexparts_auth_user', JSON.stringify(user));
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem('apexparts_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem('apexparts_auth_token', token);
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem('apexparts_auth_token');
    }
  }, [token]);

  const login = async (payload: LoginPayload): Promise<{ success: boolean; error?: string }> => {
    const res = await api.login(payload);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.token) setToken(res.token);
      setIsAuthModalOpen(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    const res = await api.register(payload);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.token) setToken(res.token);
      setIsAuthModalOpen(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = () => {
    void api.logout(token || undefined);
    setUser(null);
    setToken(null);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
