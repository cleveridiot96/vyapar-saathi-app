"use client";

import { useAppState } from './useAppState';
import type { AggregatedInventoryItem } from '@/lib/types';
import { useMemo } from 'react';

/**
 * Legacy hook - redirects to new useAppState
 * Kept for backward compatibility during migration
 */
export function useInventory(excludeTransactionId?: string) {
  const { inventory, sales, isInitialized, isCalculating } = useAppState();

  const adjustedInventory = useMemo(() => {
    if (!excludeTransactionId || !isInitialized) {
      return inventory;
    }

    const saleToExclude = sales.find(s => s.id === excludeTransactionId);
    if (!saleToExclude) {
      return inventory;
    }
    
    // This is a simplified reversal for display purposes. It adds back the sold quantities.
    const saleItemsMap = new Map<string, { quantity: number; netWeight: number }>();
    saleToExclude.items.forEach(item => {
        saleItemsMap.set(item.lotNumber, { quantity: item.quantity, netWeight: item.netWeight });
    });

    return inventory.map(invItem => {
        const saleItem = saleItemsMap.get(invItem.lotNumber);
        if (saleItem) {
            return {
                ...invItem,
                currentBags: invItem.currentBags + saleItem.quantity,
                currentWeight: invItem.currentWeight + saleItem.netWeight,
            };
        }
        return invItem;
    });

  }, [inventory, sales, excludeTransactionId, isInitialized]);

  return {
    inventory: adjustedInventory, // Keep 'inventory' for older components if they use it
    allAggregatedInventory: adjustedInventory,
    availableStock: adjustedInventory.filter(item => item.currentBags > 0.01),
    isLoading: !isInitialized || isCalculating,
  };
}
