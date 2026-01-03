"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment, MasterItemType
} from '@/lib/types';
import { useCallback, useMemo } from 'react';


// --- Primary Hook for All Data ---

export const useTransactions = () => {
  // --- LIVE DATA (Reactive Arrays) ---
  
  const purchases = useLiveQuery(() => db.purchases.toArray(), [], []);
  const sales = useLiveQuery(() => db.sales.toArray(), [], []);
  const payments = useLiveQuery(() => db.payments.toArray(), [], []);
  const receipts = useLiveQuery(() => db.receipts.toArray(), [], []);
  const locationTransfers = useLiveQuery(() => db.locationTransfers.toArray(), [], []);
  const adjustments = useLiveQuery(() => db.adjustments.toArray(), [], []);
  const purchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), [], []);
  const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), [], []);
  const ledger = useLiveQuery(() => db.ledger.toArray(), [], []);
  
  const isTransactionsLoaded = purchases !== undefined &&
                               sales !== undefined &&
                               payments !== undefined &&
                               receipts !== undefined;

  // --- DISPATCH-LIKE ACTIONS ---

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
  const addLedgerEntry = useCallback((data: LedgerEntry) => db.ledger.add(data), []);
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

export const useMasters = () => {
    const masters = useLiveQuery(() => db.masters.toArray(), [], []);

    const customers = useLiveQuery(() => db.masters.where('type').equals('Customer').toArray(), [], []);
    const suppliers = useLiveQuery(() => db.masters.where('type').equals('Supplier').toArray(), [], []);
    const agents = useLiveQuery(() => db.masters.where('type').equals('Agent').toArray(), [], []);
    const transporters = useLiveQuery(() => db.masters.where('type').equals('Transporter').toArray(), [], []);
    const warehouses = useLiveQuery(() => db.masters.where('type').equals('Warehouse').toArray(), [], []);
    const brokers = useLiveQuery(() => db.masters.where('type').equals('Broker').toArray(), [], []);
    const expenses = useLiveQuery(() => db.masters.where('type').equals('Expense').toArray(), [], []);

    const isMastersLoaded = masters !== undefined;
    
    const addOrUpdateMaster = useCallback((item: MasterItem) => db.masters.put(item), []);

    const getAllMasters = useCallback(() => masters || [], [masters]);

    const masterData = useMemo(() => ({
        Customer: customers || [],
        Supplier: suppliers || [],
        Agent: agents || [],
        Broker: brokers || [],
        Transporter: transporters || [],
        Warehouse: warehouses || [],
        Expense: expenses || [],
        Product: [], // Assuming no product masters for now
    }), [customers, suppliers, agents, brokers, transporters, warehouses, expenses]);
    
    return {
        masters: masters || [],
        masterData,
        customers: customers || [],
        suppliers: suppliers || [],
        agents: agents || [],
        transporters: transporters || [],
        warehouses: warehouses || [],
        brokers: brokers || [],
        expenses: expenses || [],
        addOrUpdateMaster,
        getAllMasters,
        isMastersLoaded,
    }
}
