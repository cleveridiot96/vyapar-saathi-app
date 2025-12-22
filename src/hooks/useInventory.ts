
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import type { AggregatedInventoryItem } from '@/lib/types';
import { calculateInventory } from '@/lib/inventoryEngine';

export function useInventory(saleIdToExclude?: string) {
    const { 
        purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns, 
        isLoaded: isTransactionsLoaded 
    } = useTransactions();
    
    const [isLoading, setIsLoading] = useState(true);
    const [allAggregatedInventory, setAllAggregatedInventory] = useState<AggregatedInventoryItem[]>([]);

    useEffect(() => {
        if (isTransactionsLoaded) {
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
        } else {
            // If dependencies are not ready, ensure we are in a loading state.
            setIsLoading(true);
        }
    }, [
        purchases,
        sales,
        adjustments,
        locationTransfers,
        purchaseReturns,
        saleReturns,
        isTransactionsLoaded,
        saleIdToExclude
    ]);

    const availableStock = useMemo(() => {
        if (isLoading) return [];
        return allAggregatedInventory.filter(item => item.currentBags > 0.01)
    }, [allAggregatedInventory, isLoading]);

    return { allAggregatedInventory, availableStock, isLoading };
}
