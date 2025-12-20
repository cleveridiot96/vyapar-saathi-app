"use client";
import { useState, useEffect, useCallback } from 'react';

// A robust hook to manage state with persistence in localStorage.
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<T>(defaultValue);

  // Read from localStorage on initial client-side mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setState(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
    }
    setHydrated(true);
  }, [key]);

  // Write to localStorage whenever state changes
  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, state, hydrated]);

  return [state, setState, !hydrated];
}
