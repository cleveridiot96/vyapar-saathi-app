
"use client";
import { useState, useEffect, useCallback } from 'react';

// This is a placeholder hook. The app has been refactored to use in-memory useState
// to prevent issues in restrictive environments like the one it's currently running in.
// Data persistence is now handled by the Backup/Restore feature.
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    console.warn(
      `useLocalStorageState is a mock. Data for key "${key}" is not being persisted to localStorage.`
    );
  }, [key]);

  return [state, setState];
}
