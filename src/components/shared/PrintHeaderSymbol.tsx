"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from 'react';

export function PrintHeaderSymbol({ className }: { className?: string }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return <div className={cn("hidden print:block", className)}>Print Header</div>
}
