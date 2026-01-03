
"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment, MasterItemType
} from '@/lib/types';
import { useCallback, useMemo } from 'react';


/**
 * Primary Hook for all transactional data.
 */
export const useTransactions = () => {
  // --- LIVE DATA (Reactive Arrays) ---
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const receipts = useLiveQuery(() => db.receipts.toArray(), []);
  const locationTransfers = useLiveQuery(() => db.locationTransfers.toArray(), []);
  const adjustments = useLiveQuery(() => db.adjustments.toArray(), []);
  const purchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), []);
  const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), []);
  const ledger = useLiveQuery(() => db.ledger.toArray(), []);
  
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
    purchases: purchases || [],
    sales: sales || [],
    payments: payments || [],
    receipts: receipts || [],
    locationTransfers: locationTransfers || [],
    purchaseReturns: purchaseReturns || [],
    saleReturns: saleReturns || [],
    ledger: ledger || [],
    adjustments: adjustments || [],
    
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
    const masters = useLiveQuery(() => db.masters.toArray(), []);

    const customers = useMemo(() => (masters || []).filter(m => m.type === 'Customer'), [masters]);
    const suppliers = useMemo(() => (masters || []).filter(m => m.type === 'Supplier'), [masters]);
    const agents = useMemo(() => (masters || []).filter(m => m.type === 'Agent'), [masters]);
    const transporters = useMemo(() => (masters || []).filter(m => m.type === 'Transporter'), [masters]);
    const warehouses = useMemo(() => (masters || []).filter(m => m.type === 'Warehouse'), [masters]);
    const brokers = useMemo(() => (masters || []).filter(m => m.type === 'Broker'), [masters]);
    const expenses = useMemo(() => (masters || []).filter(m => m.type === 'Expense'), [masters]);
    
    const isMastersLoaded = masters !== undefined;

    const addOrUpdateMaster = useCallback((item: MasterItem) => db.masters.put(item), []);
    const getAllMasters = useCallback(() => masters || [], [masters]);

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
        masters: masters || [],
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
