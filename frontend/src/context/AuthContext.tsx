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
          // Regular participant — has full profile
          setUser(data as Participant);
          setIsLoading(false);
          return;
        } else if (data && data.is_staff) {
          // Admin / staff account — no participant profile, reconstruct from stored data
          const stored = localStorage.getItem('bit2code_admin_user');
          const adminBase = stored ? JSON.parse(stored) : {};
          const adminUser = {
            ...adminBase,
            id: adminBase.id || 'admin',
            username: data.username || 'admin',
            anonymous_label: 'ADMIN',
            name: data.username || 'Admin',
            email: adminBase.email || 'admin@bit2code.ieee.org',
            is_staff: true,
            is_superuser: true,
            balance: 0,
            algorithm_assigned: null,
            algorithm_assigned_name: null,
            has_algorithm: false,
            is_coding: false,
            is_coding_finished: false,
          };
          setUser(adminUser as any);
          setIsLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem('bit2code_access_token');
        localStorage.removeItem('bit2code_refresh_token');
        localStorage.removeItem('bit2code_admin_user');
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
    const isAdminUser = credentials.username.trim().toLowerCase() === 'admin';

    // Admin uses backend JWT directly (not Firebase — admin only exists in Django DB)
    if (isAdminUser) {
      try {
        const res = await api.login(credentials);
        if (res.access) {
          localStorage.setItem('bit2code_access_token', res.access);
          localStorage.setItem('bit2code_refresh_token', res.refresh);
          // Build admin user object from the login response (avoids a second getMe() call)
          const adminUser = {
            id: res.user_id || 'admin',
            username: 'admin',
            anonymous_label: 'ADMIN',
            name: res.name || 'Admin',
            email: res.email || 'admin@bit2code.ieee.org',
            phone: '',
            college: '',
            department: '',
            year_of_study: '',
            github_profile: '',
            linkedin_profile: '',
            balance: 0,
            algorithm_assigned: null,
            algorithm_assigned_name: null,
            coding_started_at: null,
            coding_deadline: null,
            remaining_coding_seconds: 0,
            has_algorithm: false,
            is_coding: false,
            is_coding_finished: false,
            is_staff: true,
            is_superuser: true,
            created_at: new Date().toISOString(),
          };
          // Try to get real user data from backend, but don't block on it
          try {
            const me = await api.getMe();
            if (me && me.id) {
              setUser({ ...adminUser, ...me, is_staff: true });
              setIsLoading(false);
              localStorage.setItem('bit2code_admin_user', JSON.stringify({ ...adminUser, ...me, is_staff: true }));
              return;
            }
          } catch { /* backend might be local-only, use constructed admin */ }
          localStorage.setItem('bit2code_admin_user', JSON.stringify(adminUser));
          setUser(adminUser as any);
          setIsLoading(false);
          return;
        }
      } catch (backendErr: any) {
        throw new Error(backendErr.message || 'Admin login failed. Make sure the backend server (Docker) is running.');
      }
    }

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

      // 2. Fallback to backend API (e.g. for other staff users)
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
    localStorage.removeItem('bit2code_admin_user');
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
