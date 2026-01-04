
"use client";

import { useCallback, useMemo } from 'react';
import { db } from '@/lib/db';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment, MasterItemType
} from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { groupMasters } from '@/lib/utils';


/**
 * Primary Hook for all transactional data mutations.
 * Reading data is done via useLiveQuery directly in components.
 */
export const useTransactions = () => {
  const isDBPopulated = useLiveQuery(() => db.masters.count().then(c => c > 0));

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
    isTransactionsLoaded: isDBPopulated, // Simplified check
    addPurchase, updatePurchase, deletePurchase,
    addSale, updateSale, deleteSale,
    addPayment, updatePayment, deletePayment,
    addReceipt, updateReceipt, deleteReceipt,
    addLocationTransfer, addAdjustment, addPurchaseReturn, addSaleReturn,
    addLedgerEntry, removeLedgerEntries,
  };
};

/**
 * Hook for reading and mutating Master data.
 */
export const useMasters = () => {
    const masters = useLiveQuery(() => db.masters.toArray(), []);

    const addOrUpdateMaster = useCallback(async (item: MasterItem) => {
        await db.masters.put(item);
    }, []);

    const getAllMasters = useCallback(() => {
        return masters || [];
    }, [masters]);
    
    const masterData = useMemo(() => {
        const grouped = groupMasters(masters || []);
        return {
            Customer: grouped.Customer || [],
            Supplier: grouped.Supplier || [],
            Agent: grouped.Agent || [],
            Broker: grouped.Broker || [],
            Transporter: grouped.Transporter || [],
            Warehouse: grouped.Warehouse || [],
            Expense: grouped.Expense || [],
            Product: grouped.Product || [],
        }
    }, [masters]);


    return {
        masters: masters ?? [],
        masterData,
        isMastersLoaded: masters !== undefined,
        addOrUpdateMaster,
        getAllMasters,
        customers: masterData.Customer,
        suppliers: masterData.Supplier,
        agents: masterData.Agent,
        transporters: masterData.Transporter,
        warehouses: masterData.Warehouse,
        brokers: masterData.Broker,
        expenses: masterData.Expense,
    };
};
