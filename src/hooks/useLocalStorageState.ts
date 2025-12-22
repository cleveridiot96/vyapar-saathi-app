"use client";

import { useState, useEffect } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, SetValue<T>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
    }
    setIsHydrated(true);
  }, [key]);

  const setValueWithStorage: SetValue<T> = (newValue) => {
    setValue(prev => {
      const finalValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(finalValue));
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error);
      }
      return finalValue;
    });
  };

  return [isHydrated ? value : (typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue), setValueWithStorage, !isHydrated];
}
