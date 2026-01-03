
"use client";

import { useTransactions } from '@/hooks/useTransactions';
import type { AggregatedInventoryItem, Sale } from '@/lib/types';
import { useMemo } from 'react';
import { calculateInventory } from '@/lib/inventoryEngine';

export function useInventory(saleToEditId?: string | null) {
  const { sales, purchases, locationTransfers, adjustments, purchaseReturns, saleReturns, isTransactionsLoaded } = useTransactions();

  const allAggregatedInventory = useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return calculateInventory(purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns);
  }, [purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns, isTransactionsLoaded]);


  const adjustedInventory = useMemo(() => {
    if (!saleToEditId || !isTransactionsLoaded) {
      return allAggregatedInventory;
    }

    const saleToExclude = sales.find(s => s.id === saleToEditId);
    if (!saleToExclude) {
      return allAggregatedInventory;
    }
    
    const saleItemsMap = new Map<string, { quantity: number; netWeight: number }>();
    saleToExclude.items.forEach(item => {
        saleItemsMap.set(item.lotNumber, { quantity: item.quantity, netWeight: item.netWeight });
    });

    return allAggregatedInventory.map(invItem => {
        if(!invItem) return null;
        const saleItem = saleItemsMap.get(invItem.lotNumber);
        if (saleItem) {
            return {
                ...invItem,
                currentBags: invItem.currentBags + saleItem.quantity,
                currentWeight: invItem.currentWeight + saleItem.netWeight,
            };
        }
        return invItem;
    }).filter(Boolean) as AggregatedInventoryItem[];

  }, [allAggregatedInventory, sales, saleToEditId, isTransactionsLoaded]);

  return {
    allAggregatedInventory: adjustedInventory,
    availableStock: (adjustedInventory || []).filter(item => item && item.currentBags > 0.01),
    isLoading: !isTransactionsLoaded,
  };
}

export type { AggregatedInventoryItem };
