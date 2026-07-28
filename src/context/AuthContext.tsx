import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  loginByEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  isManager: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(data);

        if (currentUser) {
          // Update current user reference if updated
          const updated = data.find(u => u.id === currentUser.id);
          if (updated) setCurrentUser(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load clinic users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loginByEmail = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setCurrentUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const isManager = currentUser?.role === 'manager';
  const isStaff = currentUser?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        loginByEmail,
        switchUser,
        logout,
        refreshUsers: fetchUsers,
        isManager,
        isStaff
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
