import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

export type UserRole = 'technician' | 'reviewer' | 'admin' | 'lab_manager';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  laboratory_id?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  usersList: AuthUser[];
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(
    (localStorage.getItem('nawi_active_role') as UserRole) || 'technician'
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const list = await api.auth.getUsers();
      setUsersList(list);

      const activeUserId = localStorage.getItem('nawi_active_user_id');
      let current = list.find((u: AuthUser) => u.id === activeUserId);
      if (!current) {
        current = list.find((u: AuthUser) => u.role === role) || list[0];
      }

      if (current) {
        setUser(current);
        setRole(current.role);
        localStorage.setItem('nawi_active_role', current.role);
        localStorage.setItem('nawi_active_user_id', current.id);
      }
    } catch (err) {
      console.warn('Could not load users list from API, using default mock user');
      const fallbackUser: AuthUser = {
        id: 'usr-tech-01',
        name: 'Rajesh Kumar, Senior Test Engineer',
        email: 'tech@nawi.gov.in',
        role: 'technician',
      };
      setUser(fallbackUser);
      setUsersList([fallbackUser]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const switchRole = (newRole: UserRole) => {
    const matched = usersList.find((u) => u.role === newRole);
    if (matched) {
      setUser(matched);
      setRole(newRole);
      localStorage.setItem('nawi_active_role', newRole);
      localStorage.setItem('nawi_active_user_id', matched.id);
    } else {
      setRole(newRole);
      localStorage.setItem('nawi_active_role', newRole);
    }
  };

  const switchUser = (userId: string) => {
    const matched = usersList.find((u) => u.id === userId);
    if (matched) {
      setUser(matched);
      setRole(matched.role);
      localStorage.setItem('nawi_active_role', matched.role);
      localStorage.setItem('nawi_active_user_id', matched.id);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login(email, pass);
    if (res.token) {
      localStorage.setItem('nawi_token', res.token);
      setUser(res.user);
      setRole(res.user.role);
      localStorage.setItem('nawi_active_role', res.user.role);
      localStorage.setItem('nawi_active_user_id', res.user.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('nawi_token');
    switchRole('technician');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        usersList,
        switchRole,
        switchUser,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
