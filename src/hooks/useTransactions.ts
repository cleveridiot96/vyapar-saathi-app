
"use client";

import { useMemo, useCallback, useState, useEffect } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const receipts = useLiveQuery(() => db.receipts.toArray(), []);
  const locationTransfers = useLiveQuery(() => db.locationTransfers.toArray(), []);
  const adjustments = useLiveQuery(() => db.adjustments.toArray(), []);
  const purchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), []);
  const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), []);
  const ledger = useLiveQuery(() => db.ledger.toArray(), []);

  useEffect(() => {
    if (purchases && sales && payments && receipts && locationTransfers && adjustments && purchaseReturns && saleReturns && ledger) {
      setIsLoaded(true);
    }
  }, [purchases, sales, payments, receipts, locationTransfers, adjustments, purchaseReturns, saleReturns, ledger]);


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
  const removeLedgerEntries = useCallback(async (voucherId: string) => {
    const entriesToDelete = await db.ledger.where('relatedVoucher').equals(voucherId).toArray();
    if(entriesToDelete.length > 0) {
      const idsToDelete = entriesToDelete.map(e => e.id).filter(id => id !== undefined) as string[];
      if (idsToDelete.length > 0) {
          await db.ledger.bulkDelete(idsToDelete);
      }
    }
  }, []);

  return {
    isTransactionsLoaded: isLoaded,
    purchases: purchases || [],
    sales: sales || [],
    payments: payments || [],
    receipts: receipts || [],
    locationTransfers: locationTransfers || [],
    adjustments: adjustments || [],
    purchaseReturns: purchaseReturns || [],
    saleReturns: saleReturns || [],
    ledger: ledger || [],
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
    // 1. Direct DB Query: Fetch all masters. Fallback to empty array.
    const masters = useLiveQuery(() => db.masters.toArray(), []);

    // 2. Memoization: Group masters by type only when the masters array changes.
    const masterData = useMemo(() => {
        const grouped: { [key in MasterItemType]?: MasterItem[] } = {
          Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: []
        };
        
        (masters || []).forEach(m => {
            if (!m || !m.type || !m.name || m.name.startsWith('_DELETED_')) return; 
            if (!grouped[m.type]) {
                grouped[m.type] = [];
            }
            grouped[m.type]!.push(m);
        });
        return grouped;
    }, [masters]);

    // 3. Stable Callbacks: Ensure functions don't change on every render.
    const addOrUpdateMaster = useCallback(async (item: MasterItem) => {
        await db.masters.put(item);
    }, []);

    const getAllMasters = useCallback(() => masters || [], [masters]);

    return {
        // Raw list, with fallback
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
        // isMastersLoaded is true once the query runs (result is not undefined)
        isMastersLoaded: masters !== undefined, 
    };
};
