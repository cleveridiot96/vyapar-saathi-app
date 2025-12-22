"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import type { AggregatedInventoryItem } from '@/lib/types';
import { calculateInventory } from '@/lib/inventoryEngine';
import { useHydrated } from './useHydrated';

export function useInventory(saleIdToExclude?: string) {
    const { 
        purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns, 
        isLoaded: isTransactionsLoaded 
    } = useTransactions();
    
    const isHydrated = useHydrated();
    const [isLoading, setIsLoading] = useState(true);
    const [allAggregatedInventory, setAllAggregatedInventory] = useState<AggregatedInventoryItem[]>([]);

    useEffect(() => {
        // Only proceed if the app state is loaded and the client has hydrated.
        if (isTransactionsLoaded && isHydrated) {
            setIsLoading(true);
            
            const timer = setTimeout(() => {
                const salesToProcess = saleIdToExclude 
                    ? sales.filter(s => s.id !== saleIdToExclude) 
                    : sales;
                
                const calculatedData = calculateInventory(
                    purchases,
                    salesToProcess,
                    adjustments,
                    locationTransfers,
                    purchaseReturns,
                    saleReturns
                );

                setAllAggregatedInventory(calculatedData);
                setIsLoading(false);
            }, 50); // A small timeout to prevent blocking the render thread.

            return () => clearTimeout(timer);
        } else if (!isTransactionsLoaded || !isHydrated) {
            // If dependencies are not ready, ensure we are in a loading state.
            setIsLoading(true);
        } else {
            // This is the crucial fix: If dependencies are resolved but the effect doesn't run
            // for some other reason, ensure we exit the loading state.
            setIsLoading(false);
        }
    }, [
        purchases,
        sales,
        adjustments,
        locationTransfers,
        purchaseReturns,
        saleReturns,
        isTransactionsLoaded,
        isHydrated,
        saleIdToExclude
    ]);

    const availableStock = useMemo(() => {
        if (isLoading) return [];
        return allAggregatedInventory.filter(item => item.currentBags > 0.01)
    }, [allAggregatedInventory, isLoading]);

    return { allAggregatedInventory, availableStock, isLoading };
}
