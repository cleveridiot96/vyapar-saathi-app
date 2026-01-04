"use client";

import { useState, useEffect } from 'react';

/**
 * @deprecated This hook is no longer needed with the component-level direct query architecture.
 * Components should check for `undefined` from `useLiveQuery` to determine loading state.
 */
export function useHydrated() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}
