"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import type { AggregatedInventoryItem } from '@/lib/types';
import { calculateInventory } from '@/lib/inventoryEngine';
import { useHydrated } from './useHydrated';

export function useInventory(saleIdToExclude?: string) {
    const { purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns, isLoaded: isTransactionsLoaded } = useTransactions();
    const [isLoading, setIsLoading] = useState(true);
    const [allAggregatedInventory, setAllAggregatedInventory] = useState<AggregatedInventoryItem[]>([]);
    const isHydrated = useHydrated();

    useEffect(() => {
        if (isTransactionsLoaded && isHydrated) {
            setIsLoading(true);
            // Use setTimeout to offload the calculation to a macrotask, preventing UI freeze
            const timer = setTimeout(() => {
                const salesToProcess = saleIdToExclude ? sales.filter(s => s.id !== saleIdToExclude) : sales;
                
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
            }, 50); // A short delay is enough to allow the UI to update

            return () => clearTimeout(timer);
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
