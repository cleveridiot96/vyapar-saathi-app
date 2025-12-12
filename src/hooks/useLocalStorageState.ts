"use client";

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorageState<T>(key: string, defaultValue: T, migrator?: (data: any) => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // This part runs only on the client during initial render
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        return migrator ? migrator(parsedItem) : parsedItem;
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return defaultValue;
  });

  const setAndStoreState = useCallback((newValue: T | ((prevState: T) => T)) => {
      setState(prevState => {
          const valueToStore = newValue instanceof Function ? newValue(prevState) : newValue;
          try {
              window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (error) {
              console.error(`Error setting localStorage key “${key}”:`, error);
          }
          return valueToStore;
      });
  }, [key]);

  return [state, setAndStoreState];
}
