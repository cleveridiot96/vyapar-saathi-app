
"use client";

import { useState, useEffect } from 'react';

export function useHydrated() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // This effect runs only on the client, after the initial render.
        // Therefore, setting hydrated to true here ensures server and client
        // match on the first render, and subsequent client-only logic can run.
        setHydrated(true);
    }, []);

    return hydrated;
}
