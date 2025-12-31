"use client";

import { useState, useEffect } from 'react';
import { useAppState } from './useAppState';

export function useHydrated() {
    const [hydrated, setHydrated] = useState(false);
    const { isLoaded } = useAppState();

    useEffect(() => {
        // We are hydrated when the app state is fully loaded from the background worker.
        if (isLoaded) {
            setHydrated(true);
        }
    }, [isLoaded]);

    return hydrated;
}
