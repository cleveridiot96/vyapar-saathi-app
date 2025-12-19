
"use client";

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import type { AggregatedInventoryItem } from '@/lib/types';
import { FIXED_WAREHOUSES } from '@/lib/constants';

const KEY_SEPARATOR = '_$_';

export function useInventory(saleIdToExclude?: string) {
    const { purchases, purchaseReturns, sales, saleReturns, locationTransfers, adjustments, isTransactionsLoaded } = useTransactions();

    const allAggregatedInventory = useMemo(() => {
        if (!isTransactionsLoaded) return [];

        const inventory: Record<string, AggregatedInventoryItem> = {};

        // 1. Process Purchases
        purchases.forEach(p => {
            p.items.forEach(item => {
                const key = `${p.locationId}${KEY_SEPARATOR}${item.lotNumber}`;
                if (!inventory[key]) {
                    inventory[key] = {
                        key,
                        lotNumber: item.lotNumber,
                        originalBags: 0,
                        currentBags: 0,
                        currentWeight: 0,
                        purchaseRate: item.rate,
                        effectiveRate: item.landedCostPerKg,
                        cogs: 0,
                        locationId: p.locationId,
                        locationName: p.locationName,
                        supplierName: p.supplierName,
                        purchaseDate: p.date,
                        averageWeightPerBag: item.quantity > 0 ? item.netWeight / item.quantity : 0,
                        costBreakdown: {
                            baseRate: item.rate,
                            purchaseExpenses: item.landedCostPerKg - item.rate,
                            transferExpenses: 0,
                        }
                    };
                }
                inventory[key].originalBags += item.quantity;
                inventory[key].currentBags += item.quantity;
                inventory[key].currentWeight += item.netWeight;
            });
        });
        
        // 2. Process Adjustments
        (adjustments || []).forEach(adj => {
            const key = `${adj.locationId}${KEY_SEPARATOR}${adj.lotNumber}`;
            if(inventory[key]) {
                inventory[key].currentBags += adj.bags;
                inventory[key].currentWeight += adj.weight;
            } else {
                 const purchaseForItem = purchases.find(p => p.items.some(i => i.lotNumber === adj.lotNumber));
                 if(purchaseForItem) {
                     const originalItem = purchaseForItem.items.find(i => i.lotNumber === adj.lotNumber)!;
                     inventory[key] = {
                        key,
                        lotNumber: adj.lotNumber,
                        originalBags: adj.bags,
                        currentBags: adj.bags,
                        currentWeight: adj.weight,
                        purchaseRate: originalItem.rate,
                        effectiveRate: originalItem.landedCostPerKg,
                        cogs: 0,
                        locationId: adj.locationId,
                        locationName: adj.locationName,
                        supplierName: purchaseForItem.supplierName,
                        purchaseDate: purchaseForItem.date,
                        averageWeightPerBag: originalItem.quantity > 0 ? originalItem.netWeight / originalItem.quantity : 0,
                        costBreakdown: {
                            baseRate: originalItem.rate,
                            purchaseExpenses: originalItem.landedCostPerKg - originalItem.rate,
                            transferExpenses: 0,
                        }
                    };
                 }
            }
        });

        // 3. Process Transfers
        locationTransfers.forEach(lt => {
            lt.items.forEach(item => {
                const sourceKey = `${lt.fromLocationId}${KEY_SEPARATOR}${item.originalLotNumber}`;
                const destKey = `${lt.toLocationId}${KEY_SEPARATOR}${item.newLotNumber}`;

                if (inventory[sourceKey]) {
                    inventory[sourceKey].currentBags -= item.quantity;
                    inventory[sourceKey].currentWeight -= item.netWeight;
                }

                const sourceItem = inventory[sourceKey];
                const transferExpensePerKg = item.netWeight > 0 ? (lt.totalTransferCost / lt.items.reduce((sum, i) => sum + i.netWeight, 0)) : 0;
                
                if (!inventory[destKey]) {
                    inventory[destKey] = {
                        key: destKey,
                        lotNumber: item.newLotNumber,
                        originalBags: 0,
                        currentBags: 0,
                        currentWeight: 0,
                        purchaseRate: sourceItem?.purchaseRate || 0,
                        effectiveRate: (sourceItem?.effectiveRate || 0) + transferExpensePerKg,
                        cogs: 0,
                        locationId: lt.toLocationId,
                        locationName: lt.toLocationName,
                        supplierName: sourceItem?.supplierName || 'N/A',
                        purchaseDate: sourceItem?.purchaseDate || lt.date,
                        averageWeightPerBag: item.quantity > 0 ? item.netWeight / item.quantity : (sourceItem?.averageWeightPerBag || 0),
                        costBreakdown: {
                            baseRate: sourceItem?.costBreakdown.baseRate || 0,
                            purchaseExpenses: sourceItem?.costBreakdown.purchaseExpenses || 0,
                            transferExpenses: (sourceItem?.costBreakdown.transferExpenses || 0) + transferExpensePerKg,
                        }
                    };
                }
                inventory[destKey].originalBags += item.quantity;
                inventory[destKey].currentBags += item.quantity;
                inventory[destKey].currentWeight += item.netWeight;
            });
        });

        // 4. Process Returns
        purchaseReturns.forEach(pr => {
             const purchase = purchases.find(p => p.id === pr.originalPurchaseId);
             if (purchase) {
                const key = `${purchase.locationId}${KEY_SEPARATOR}${pr.originalLotNumber}`;
                if (inventory[key]) {
                    inventory[key].currentBags -= pr.quantityReturned;
                    inventory[key].currentWeight -= pr.netWeightReturned;
                }
             }
        });
        
        saleReturns.forEach(sr => {
            const sale = sales.find(s => s.id === sr.originalSaleId);
            if (sale) {
                const originalSaleItem = sale.items.find(i => i.lotNumber === sr.originalLotNumber);
                if (originalSaleItem) {
                    const mumbaiWarehouse = Object.values(inventory).find(i => i.locationId === FIXED_WAREHOUSES.find(fw => fw.name === 'Mumbai')?.id);
                    const key = `${mumbaiWarehouse?.locationId || 'wh-mumbai'}${KEY_SEPARATOR}${sr.originalLotNumber}`;
                     if (inventory[key]) {
                        inventory[key].currentBags += sr.quantityReturned;
                        inventory[key].currentWeight += sr.netWeightReturned;
                    }
                }
            }
        });

        // 5. Subtract Sales
        sales.forEach(s => {
            if (s.id === saleIdToExclude) return;
            s.items.forEach(item => {
                 const mumbaiWarehouse = Object.values(inventory).find(i => i.locationId === FIXED_WAREHOUSES.find(fw => fw.name === 'Mumbai')?.id);
                 const key = `${mumbaiWarehouse?.locationId || 'wh-mumbai'}${KEY_SEPARATOR}${item.lotNumber}`;
                 if (inventory[key]) {
                    inventory[key].currentBags -= item.quantity;
                    inventory[key].currentWeight -= item.netWeight;
                }
            });
        });
        
        // Final pass for COGS calculation
        Object.values(inventory).forEach(item => {
            item.cogs = item.currentWeight * item.effectiveRate;
        });

        return Object.values(inventory);

    }, [
        purchases,
        purchaseReturns,
        sales,
        saleReturns,
        locationTransfers,
        adjustments,
        isTransactionsLoaded,
        saleIdToExclude
    ]);

    const availableStock = useMemo(() => allAggregatedInventory.filter(item => item.currentBags > 0.01), [allAggregatedInventory]);

    return { allAggregatedInventory, availableStock, isLoading: !isTransactionsLoaded };
}
