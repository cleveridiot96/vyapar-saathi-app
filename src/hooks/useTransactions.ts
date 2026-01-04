
"use client";

import { useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment, MasterItemType
} from '@/lib/types';


/**
 * Primary Hook for all transactional data mutations.
 * Reading data is done via useLiveQuery directly in components.
 */
export const useTransactions = () => {
  const addPurchase = useCallback(async (data: Purchase) => db.purchases.put(data), []);
  const updatePurchase = useCallback(async (data: Purchase) => db.purchases.put(data), []);
  const deletePurchase = useCallback(async (id: string) => db.purchases.delete(id), []);

  const addSale = useCallback(async (data: Sale) => db.sales.put(data), []);
  const updateSale = useCallback(async (data: Sale) => db.sales.put(data), []);
  const deleteSale = useCallback(async (id: string) => db.sales.delete(id), []);

  const addPayment = useCallback(async (data: Payment) => db.payments.put(data), []);
  const updatePayment = useCallback(async (data: Payment) => db.payments.put(data), []);
  const deletePayment = useCallback(async (id: string) => db.payments.delete(id), []);
  
  const addReceipt = useCallback(async (data: Receipt) => db.receipts.put(data), []);
  const updateReceipt = useCallback(async (data: Receipt) => db.receipts.put(data), []);
  const deleteReceipt = useCallback(async (id: string) => db.receipts.delete(id), []);

  const addLocationTransfer = useCallback(async (data: LocationTransfer) => db.locationTransfers.put(data), []);
  const addAdjustment = useCallback(async (data: StockAdjustment) => db.adjustments.put(data), []);
  
  const addPurchaseReturn = useCallback(async (data: PurchaseReturn) => db.purchaseReturns.put(data), []);
  const addSaleReturn = useCallback(async (data: SaleReturn) => db.saleReturns.put(data), []);

  const addLedgerEntry = useCallback(async (data: LedgerEntry[] | LedgerEntry) => {
    const entries = Array.isArray(data) ? data : [data];
    if (entries.length === 0) return;
    await db.ledger.bulkPut(entries);
  }, []);
  const removeLedgerEntries = useCallback(async (voucherId: string) => db.ledger.where('relatedVoucher').equals(voucherId).delete(), []);

  return {
    addPurchase, updatePurchase, deletePurchase,
    addSale, updateSale, deleteSale,
    addPayment, updatePayment, deletePayment,
    addReceipt, updateReceipt, deleteReceipt,
    addLocationTransfer, addAdjustment, addPurchaseReturn, addSaleReturn,
    addLedgerEntry, removeLedgerEntries,
  };
};

/**
 * Hook for reading all Master data. It reads directly from the database
 * and provides both the full list and grouped lists by type.
 * It is defensive and returns empty arrays during initialization to prevent crashes.
 */
export const useMasters = () => {
    // 1. Direct DB Query: Fetch all masters, defaulting to an empty array.
    const masters = useLiveQuery(() => db.masters.toArray(), []);

    // 2. Memoization: Group masters by type only when the masters array changes.
    const masterData = useMemo(() => {
        const grouped: { [key in MasterItemType]?: MasterItem[] } = {};
        // Use `(masters || [])` as a safety net in case useLiveQuery is briefly not ready.
        (masters || []).forEach(m => {
            if (!m || !m.type) return; // Defensive check for malformed data
            if (!grouped[m.type]) {
                grouped[m.type] = [];
            }
            grouped[m.type]!.push(m);
        });
        return grouped;
    }, [masters]);

    // 3. Stable Callbacks: Ensure functions don't change on every render.
    const addOrUpdateMaster = useCallback(async (item: MasterItem) => {
        // Add validation or transformation logic here if needed
        await db.masters.put(item);
    }, []);

    const getAllMasters = useCallback(() => masters || [], [masters]);

    return {
        // Raw list
        masters: masters || [],
        
        // Grouped data, with fallbacks to empty arrays to prevent crashes
        masterData,
        customers: masterData.Customer || [],
        suppliers: masterData.Supplier || [],
        agents: masterData.Agent || [],
        transporters: masterData.Transporter || [],
        warehouses: masterData.Warehouse || [],
        brokers: masterData.Broker || [],
        expenses: masterData.Expense || [],
        
        // Actions and metadata
        addOrUpdateMaster,
        getAllMasters,
        isMastersLoaded: Array.isArray(masters), // True once the query has run (even if it's empty)
    };
};
