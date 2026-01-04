
"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AggregatedInventoryItem } from '@/lib/types';
import { useMemo } from 'react';
import { calculateInventory } from '@/lib/inventoryEngine';

export function useInventory(saleToEditId?: string | null) {
  const purchases = useLiveQuery(() => db.purchases.toArray(), []) ?? [];
  const sales = useLiveQuery(() => db.sales.toArray(), []) ?? [];
  const adjustments = useLiveQuery(() => db.adjustments.toArray(), []) ?? [];
  const locationTransfers = useLiveQuery(() => db.locationTransfers.toArray(), []) ?? [];
  const purchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), []) ?? [];
  const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), []) ?? [];
  
  const allAggregatedInventory = useMemo(() => {
    return calculateInventory(purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns);
  }, [purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns]);


  const adjustedInventory = useMemo(() => {
    if (!saleToEditId) {
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

  }, [allAggregatedInventory, sales, saleToEditId]);

  return {
    allAggregatedInventory: adjustedInventory,
    availableStock: (adjustedInventory || []).filter(item => item && item.currentBags > 0.01),
    isLoading: false, // Data is always an array, never "loading"
    isReady: true,
  };
}

export type { AggregatedInventoryItem };
