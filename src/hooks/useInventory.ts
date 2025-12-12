"use client";

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import type { AggregatedInventoryItem, Purchase, PurchaseReturn, Sale, LocationTransfer } from '@/lib/types';
import { parseISO } from 'date-fns';

export function useInventory(saleIdToExclude?: string) {
    const { purchases, purchaseReturns, sales, locationTransfers } = useTransactions();

    const aggregatedStock = useMemo(() => {
        const inventory: Record<string, AggregatedInventoryItem> = {};

        // 1. Process Purchases
        purchases.forEach(p => {
            p.items.forEach(item => {
                const key = item.lotNumber;
                if (!inventory[key]) {
                    inventory[key] = {
                        lotNumber: item.lotNumber,
                        originalBags: 0,
                        currentBags: 0,
                        purchaseRate: item.rate,
                        effectiveRate: item.landedCostPerKg,
                        locationId: p.locationId,
                        locationName: p.locationName,
                        supplierName: p.supplierName,
                        purchaseDate: p.date,
                        averageWeightPerBag: item.netWeight / item.quantity,
                    };
                }
                inventory[key].originalBags += item.quantity;
                inventory[key].currentBags += item.quantity;
            });
        });

        // 2. Subtract Purchase Returns
        purchaseReturns.forEach(pr => {
            const key = pr.originalLotNumber;
            if (inventory[key]) {
                inventory[key].currentBags -= pr.quantityReturned;
            }
        });

        // 3. Subtract Sales
        sales.forEach(s => {
            if (s.id === saleIdToExclude) return; // Skip the sale being edited
            s.items.forEach(item => {
                const key = item.lotNumber;
                if (inventory[key]) {
                    inventory[key].currentBags -= item.quantity;
                }
            });
        });

        // 4. Adjust for Location Transfers
        locationTransfers.forEach(lt => {
            lt.items.forEach(item => {
                const key = item.originalLotNumber;
                if (inventory[key]) {
                    // This logic assumes a transfer OUT decreases stock from the original location.
                    // A full implementation would need to track stock at multiple locations.
                    // For now, we just reduce from the source.
                    // A corresponding increase would happen at the destination if we tracked per-location stock.
                    if (inventory[key].locationId === lt.fromLocationId) {
                        inventory[key].currentBags -= item.quantity;
                    }
                     if (inventory[key].locationId === lt.toLocationId) {
                        inventory[key].currentBags += item.quantity;
                    }
                }
            });
        });


        return Object.values(inventory).filter(item => item.currentBags > 0.01);
    }, [purchases, purchaseReturns, sales, locationTransfers, saleIdToExclude]);

    return { availableStock: aggregatedStock };
}
