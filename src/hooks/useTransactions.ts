
"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment, MasterItemType
} from '@/lib/types';
import { useCallback, useMemo } from 'react';
import type Dexie from 'dexie';

/**
 * FAIL-SAFE LIVE QUERIES
 * Wraps useLiveQuery in a try-catch block.
 * Returns [] if the DB throws an error (e.g. "Table not found" or "Decryption failed").
 * This prevents the "TypeError: ... is not iterable" crash.
 */
const safeLiveQuery = <T,>(query: () => Promise<T[]>, defaultValue: T[]): T[] => {
  try {
    // Note: useLiveQuery can return undefined while the query is running.
    // The || operator provides our default value during this initial phase and on error.
    return useLiveQuery(query, defaultValue) ?? defaultValue;
  } catch (error) {
    console.error(`A database query failed:`, error);
    // If an error is thrown during the query, return the default value.
    return defaultValue;
  }
};


/**
 * Primary Hook for all transactional data.
 */
export const useTransactions = () => {
  // --- LIVE DATA (Fail-Safe) ---
  const purchases: Purchase[] = safeLiveQuery(() => db.purchases.toArray(), []);
  const sales: Sale[] = safeLiveQuery(() => db.sales.toArray(), []);
  const payments: Payment[] = safeLiveQuery(() => db.payments.toArray(), []);
  const receipts: Receipt[] = safeLiveQuery(() => db.receipts.toArray(), []);
  const locationTransfers: LocationTransfer[] = safeLiveQuery(() => db.locationTransfers.toArray(), []);
  const adjustments: StockAdjustment[] = safeLiveQuery(() => db.adjustments.toArray(), []);
  const purchaseReturns: PurchaseReturn[] = safeLiveQuery(() => db.purchaseReturns.toArray(), []);
  const saleReturns: SaleReturn[] = safeLiveQuery(() => db.saleReturns.toArray(), []);
  const ledger: LedgerEntry[] = safeLiveQuery(() => db.ledger.toArray(), []);
  const isTransactionsLoaded = purchases !== undefined;

  // --- ACTIONS ---
  const addPurchase = useCallback((data: Purchase) => db.purchases.add(data), []);
  const updatePurchase = useCallback((data: Purchase) => db.purchases.put(data), []);
  const deletePurchase = useCallback((id: string) => db.purchases.delete(id), []);

  const addSale = useCallback((data: Sale) => db.sales.add(data), []);
  const updateSale = useCallback((data: Sale) => db.sales.put(data), []);
  const deleteSale = useCallback((id: string) => db.sales.delete(id), []);

  const addPayment = useCallback((data: Payment) => db.payments.add(data), []);
  const updatePayment = useCallback((data: Payment) => db.payments.put(data), []);
  const deletePayment = useCallback((id: string) => db.payments.delete(id), []);
  
  const addReceipt = useCallback((data: Receipt) => db.receipts.add(data), []);
  const updateReceipt = useCallback((data: Receipt) => db.receipts.put(data), []);
  const deleteReceipt = useCallback((id: string) => db.receipts.delete(id), []);

  const addLocationTransfer = useCallback((data: LocationTransfer) => db.locationTransfers.add(data), []);
  const addAdjustment = useCallback((data: StockAdjustment) => db.adjustments.add(data), []);
  
  const addPurchaseReturn = useCallback((data: PurchaseReturn) => db.purchaseReturns.add(data), []);
  const addSaleReturn = useCallback((data: SaleReturn) => db.saleReturns.add(data), []);

  const addLedgerEntry = useCallback((data: LedgerEntry[] | LedgerEntry) => db.ledger.bulkAdd(Array.isArray(data) ? data : [data]), []);
  const removeLedgerEntries = useCallback((voucherId: string) => db.ledger.where('relatedVoucher').equals(voucherId).delete(), []);

  return {
    purchases,
    sales,
    payments,
    receipts,
    locationTransfers,
    purchaseReturns,
    saleReturns,
    ledger,
    adjustments,
    
    addPurchase, updatePurchase, deletePurchase,
    addSale, updateSale, deleteSale,
    addPayment, updatePayment, deletePayment,
    addReceipt, updateReceipt, deleteReceipt,
    addLocationTransfer, addAdjustment, addPurchaseReturn, addSaleReturn,
    addLedgerEntry, removeLedgerEntries,

    isTransactionsLoaded,
  };
};

/**
 * Separate hook for Master Data to keep things organized.
 */
export const useMasters = () => {
    const masters = safeLiveQuery(() => db.masters.toArray(), []);

    const customers = useMemo(() => masters.filter(m => m.type === 'Customer'), [masters]);
    const suppliers = useMemo(() => masters.filter(m => m.type === 'Supplier'), [masters]);
    const agents = useMemo(() => masters.filter(m => m.type === 'Agent'), [masters]);
    const transporters = useMemo(() => masters.filter(m => m.type === 'Transporter'), [masters]);
    const warehouses = useMemo(() => masters.filter(m => m.type === 'Warehouse'), [masters]);
    const brokers = useMemo(() => masters.filter(m => m.type === 'Broker'), [masters]);
    const expenses = useMemo(() => masters.filter(m => m.type === 'Expense'), [masters]);
    
    const isMastersLoaded = masters !== undefined;

    const addOrUpdateMaster = useCallback((item: MasterItem) => db.masters.put(item), []);
    const getAllMasters = useCallback(() => masters, [masters]);

    const masterData = useMemo(() => ({
        Customer: customers,
        Supplier: suppliers,
        Agent: agents,
        Broker: brokers,
        Transporter: transporters,
        Warehouse: warehouses,
        Expense: expenses,
        Product: [],
    }), [customers, suppliers, agents, brokers, transporters, warehouses, expenses]);
    
    return {
        masters,
        masterData,
        customers,
        suppliers,
        agents,
        transporters,
        warehouses,
        brokers,
        expenses,
        addOrUpdateMaster,
        getAllMasters,
        isMastersLoaded,
    }
}
