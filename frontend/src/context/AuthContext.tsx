import React, { createContext, useContext, useState, useEffect } from 'react';
import { Participant } from '../types';
import { api } from '../services/api';

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
    const token = localStorage.getItem('bit2code_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data.id) {
        setUser(data as Participant);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      localStorage.removeItem('bit2code_access_token');
      localStorage.removeItem('bit2code_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.access) {
      localStorage.setItem('bit2code_access_token', res.access);
      localStorage.setItem('bit2code_refresh_token', res.refresh);
      await refreshUser();
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
