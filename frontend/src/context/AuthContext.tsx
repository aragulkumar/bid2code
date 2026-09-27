import React, { createContext, useContext, useState, useEffect } from 'react';
import { Participant } from '../types';
import { api } from '../services/api';
import { loginParticipantWithFirebase } from '../services/firebase';

interface AuthContextType {
  user: Participant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    // 1. Try active backend token first
    const token = localStorage.getItem('bit2code_access_token');
    if (token) {
      try {
        const data = await api.getMe();
        if (data && data.id) {
          setUser(data as Participant);
          setIsLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem('bit2code_access_token');
        localStorage.removeItem('bit2code_refresh_token');
      }
    }

    // 2. Check if participant has a Firebase session (24/7 cloud availability)
    const storedFbUser = localStorage.getItem('bit2code_firebase_user');
    if (storedFbUser) {
      try {
        const parsed = JSON.parse(storedFbUser);
        setUser(parsed as Participant);
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem('bit2code_firebase_user');
      }
    }

    setUser(null);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    // 1. Try Firebase Cloud first (handles all participant registrations)
    try {
      const fbUser = await loginParticipantWithFirebase(credentials);
      localStorage.setItem('bit2code_firebase_user', JSON.stringify(fbUser));
      setUser(fbUser as any);

      // Best effort backend sync in background
      api.login(credentials)
        .then(res => {
          if (res.access) {
            localStorage.setItem('bit2code_access_token', res.access);
            localStorage.setItem('bit2code_refresh_token', res.refresh);
          }
        })
        .catch(() => {});
      return;
    } catch (fbErr: any) {
      // If it's an explicit wrong password, fail immediately
      if (fbErr.message?.includes('Incorrect password')) {
        throw fbErr;
      }

      // 2. Fallback to backend API (e.g. for staff/admin user)
      try {
        const res = await api.login(credentials);
        if (res.access) {
          localStorage.setItem('bit2code_access_token', res.access);
          localStorage.setItem('bit2code_refresh_token', res.refresh);
          await refreshUser();
          return;
        }
      } catch (backendErr: any) {
        throw new Error(fbErr.message || backendErr.message || 'Invalid username or password.');
      }
    }
  };

  const register = async (formData: any) => {
    const res = await api.register(formData);
    if (res.access) {
      localStorage.setItem('bit2code_access_token', res.access);
      localStorage.setItem('bit2code_refresh_token', res.refresh);
      await refreshUser();
    }
  };

  const logout = () => {
    localStorage.removeItem('bit2code_access_token');
    localStorage.removeItem('bit2code_refresh_token');
    localStorage.removeItem('bit2code_firebase_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
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
