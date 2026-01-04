"use client";

import React, { createContext, useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { db } from '@/lib/db';
import { deriveKey, encryptData, decryptData } from '@/lib/encryption';
import { AuthDataItem } from '@/lib/types';

// A constant key for the test phrase used to verify the password
const ENCRYPTED_PHRASE_KEY = 'verify_phrase';
const SALT_KEY = 'auth_salt';

interface AuthContextType {
  isAuthenticated: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  hasPassword: () => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  setPassword: (password: string) => Promise<void>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const PasswordProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const hasPassword = useCallback(async (): Promise<boolean> => {
    const salt = await db.auth.get(SALT_KEY);
    return !!salt;
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      const saltItem: AuthDataItem | undefined = await db.auth.get(SALT_KEY);
      const phraseItem: AuthDataItem | undefined = await db.auth.get(ENCRYPTED_PHRASE_KEY);

      if (!saltItem || !phraseItem) return false;

      const key = await deriveKey(password, saltItem.value as Uint8Array);
      const decrypted = await decryptData(key, phraseItem.value as string);

      if (decrypted === 'vyapar-saathi-ok') {
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch {
      // In a real app, you might want to show a toast notification here.
      return false;
    }
  }, []);

  const setPassword = useCallback(async (password: string): Promise<void> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const encryptedPhrase = await encryptData(key, 'vyapar-saathi-ok');

    await db.auth.bulkPut([
      { key: SALT_KEY, value: salt },
      { key: ENCRYPTED_PHRASE_KEY, value: encryptedPhrase }
    ]);

    setIsUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
  }, []);
  
  const value = useMemo(() => ({
    isAuthenticated: isUnlocked,
    isUnlocked,
    isLoading,
    hasPassword,
    unlock,
    setPassword,
    lock,
  }), [isUnlocked, isLoading, hasPassword, unlock, setPassword, lock]);

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
