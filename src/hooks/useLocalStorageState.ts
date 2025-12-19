"use client";
import { useState, useEffect, useCallback } from 'react';
import { useHydrated } from './useHydrated';

// A robust hook to manage state with persistence in localStorage.
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const isHydrated = useHydrated();

  const [state, setState] = useState<T>(() => {
    // We can't access localStorage on the server, so we return default value.
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });
  
  // This effect runs on the client after hydration to sync state with localStorage.
  useEffect(() => {
    if (isHydrated) {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setState(JSON.parse(item));
            }
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}” on mount:`, error);
        }
    }
  }, [key, isHydrated]);


  // This effect updates localStorage whenever the state changes.
  useEffect(() => {
    if (isHydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, state, isHydrated]);

  return [state, setState, !isHydrated];
}
