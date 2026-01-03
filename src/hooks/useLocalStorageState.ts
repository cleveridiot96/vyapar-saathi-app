"use client";

import { useState, useEffect, useCallback } from 'react';

// Helper function to safely parse JSON from localStorage
function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
    if (jsonString === null) {
        return defaultValue;
    }
    try {
        const parsed = JSON.parse(jsonString);
        return parsed ?? defaultValue;
    } catch (e) {
        console.warn('Failed to parse JSON from localStorage:', e);
        return defaultValue;
    }
}

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // This effect runs once on the client after hydration
        try {
            const item = localStorage.getItem(key);
            setValue(safelyParseJSON(item, defaultValue));
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
        } finally {
            setIsHydrated(true);
        }
    }, [key, defaultValue]);

    const setAndPersistValue = useCallback((newValue: T | ((val: T) => T)) => {
        // This check ensures we don't try to write to localStorage on the server
        if (!isHydrated) {
            // During hydration, we only update the in-memory state
            setValue(newValue);
            return;
        }

        try {
            const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
            setValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, value, isHydrated]);

    return [value, setAndPersistValue];
}
