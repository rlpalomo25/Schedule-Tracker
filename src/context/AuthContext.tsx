import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';
import { parseInitialEmployees } from '../data/teamData';

interface AuthContextType {
  currentUser: Employee | null;
  allEmployees: Employee[];
  login: (usernameOrEmail: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (employeeId: string) => void;
  isManagerOrSupervisor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sd_schedule_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allEmployees] = useState<Employee[]>(() => parseInitialEmployees());
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedId) {
      const found = allEmployees.find(e => e.id === savedId);
      if (found) return found;
    }
    // Default to first employee (Carlos Garcia) or Tom Hardy
    return allEmployees[0] || null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, currentUser.id);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  const login = (usernameOrEmail: string, _password?: string): boolean => {
    const query = usernameOrEmail.trim().toLowerCase();
    const found = allEmployees.find(
      e => e.email.toLowerCase() === query || e.username.toLowerCase() === query || e.name.toLowerCase() === query
    );
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (employeeId: string) => {
    const found = allEmployees.find(e => e.id === employeeId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const isManagerOrSupervisor = 
    currentUser?.role === 'manager' || 
    currentUser?.role === 'supervisor' || 
    currentUser?.role === 'admin' ||
    currentUser?.name === 'Tom Hardy';

  const isAdmin = currentUser?.name === 'Tom Hardy' || currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allEmployees,
        login,
        logout,
        switchUser,
        isManagerOrSupervisor,
        isAdmin,
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
