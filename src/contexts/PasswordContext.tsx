
"use client";

import React, { createContext, useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { db, setSessionKey, clearSessionKey } from '@/lib/db';
import { deriveKey } from '@/lib/encryption';

interface AuthContextType {
  isAuthenticated: boolean;
  isUnlocked: boolean;
  hasPassword: () => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  setPassword: (password: string) => Promise<void>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SALT_KEY = 'encryption_salt';

export const PasswordProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Always authenticated
  const [isUnlocked, setIsUnlocked] = useState(false);
  const isHydrated = useHydrated();

  const hasPassword = useCallback(async (): Promise<boolean> => {
    // Bypassed
    return Promise.resolve(false);
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    // Bypassed
    setIsAuthenticated(true);
    return true;
  }, []);

  const setPassword = useCallback(async (password: string): Promise<void> => {
    // Bypassed
    setIsAuthenticated(true);
  }, []);

  const lock = useCallback(() => {
    // Bypassed
    setIsAuthenticated(true);
  }, []);
  
  const value = useMemo(() => ({
    isAuthenticated: true, // Always true
    isUnlocked,
    hasPassword,
    unlock,
    setPassword,
    lock,
  }), [isAuthenticated, isUnlocked, hasPassword, unlock, setPassword, lock]);

  if (!isHydrated) {
    return null; // Or a loading spinner
  }

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
