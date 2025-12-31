
"use client";

import { useAppState } from './useAppState';
import type { AggregatedInventoryItem } from '@/lib/types';
import { useMemo } from 'react';

export function useInventory(saleToEditId?: string | null) {
  const { inventory, sales, isInitialized, isCalculating } = useAppState();

  const adjustedInventory = useMemo(() => {
    if (!saleToEditId || !isInitialized) {
      return inventory;
    }

    const saleToExclude = sales.find(s => s.id === saleToEditId);
    if (!saleToExclude) {
      return inventory;
    }
    
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

  }, [inventory, sales, saleToEditId, isInitialized]);

  return {
    allAggregatedInventory: adjustedInventory,
    availableStock: adjustedInventory.filter(item => item.currentBags > 0.01),
    isLoading: !isInitialized || isCalculating,
  };
}
