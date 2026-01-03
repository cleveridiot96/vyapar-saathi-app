
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const isHydrated = useHydrated();

  const hasPassword = useCallback(async (): Promise<boolean> => {
    const salt = await db.keyval.get(SALT_KEY);
    return !!salt;
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    setIsUnlocked(true);
    try {
      const saltEntry = await db.keyval.get(SALT_KEY);
      if (!saltEntry?.value) {
        console.error("Salt not found. Cannot unlock.");
        return false;
      }
      const key = await deriveKey(password, saltEntry.value);
      setSessionKey(key);
      
      // Test decryption to verify the key.
      await db.masters.limit(1).first(); 
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Unlock failed, likely incorrect password:", error);
      clearSessionKey();
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsUnlocked(false);
    }
  }, []);

  const setPassword = useCallback(async (password: string): Promise<void> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    await db.keyval.put({ key: SALT_KEY, value: salt });
    const key = await deriveKey(password, salt);
    setSessionKey(key);
    // After setting the password, we are authenticated.
    setIsAuthenticated(true);
  }, []);

  const lock = useCallback(() => {
    clearSessionKey();
    setIsAuthenticated(false);
  }, []);
  
  const value = useMemo(() => ({
    isAuthenticated,
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
