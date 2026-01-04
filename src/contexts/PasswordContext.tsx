"use client";

import React, { createContext, useState, useCallback, useEffect, useMemo, useContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isUnlocked: boolean;
  hasPassword: () => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  setPassword: (password: string) => Promise<void>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const PasswordProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const hasPassword = useCallback(async (): Promise<boolean> => {
    return Promise.resolve(false);
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    setIsAuthenticated(true);
    return true;
  }, []);

  const setPassword = useCallback(async (password: string): Promise<void> => {
    setIsAuthenticated(true);
    return Promise.resolve();
  }, []);

  const lock = useCallback(() => {
    setIsAuthenticated(true); 
  }, []);
  
  const value = useMemo(() => ({
    isAuthenticated: true, 
    isUnlocked: true,
    hasPassword,
    unlock,
    setPassword,
    lock,
  }), [hasPassword, unlock, setPassword, lock]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a PasswordProvider');
  }
  return context;
};
