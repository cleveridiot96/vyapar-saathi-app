"use client";

import { useCallback, useMemo } from 'react';
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
  const addPurchase = useCallback(async (data: Purchase) => db.purchases.add(data), []);
  const updatePurchase = useCallback(async (data: Purchase) => db.purchases.put(data), []);
  const deletePurchase = useCallback(async (id: string) => db.purchases.delete(id), []);

  const addSale = useCallback(async (data: Sale) => db.sales.add(data), []);
  const updateSale = useCallback(async (data: Sale) => db.sales.put(data), []);
  const deleteSale = useCallback(async (id: string) => db.sales.delete(id), []);

  const addPayment = useCallback(async (data: Payment) => db.payments.add(data), []);
  const updatePayment = useCallback(async (data: Payment) => db.payments.put(data), []);
  const deletePayment = useCallback(async (id: string) => db.payments.delete(id), []);
  
  const addReceipt = useCallback(async (data: Receipt) => db.receipts.add(data), []);
  const updateReceipt = useCallback(async (data: Receipt) => db.receipts.put(data), []);
  const deleteReceipt = useCallback(async (id: string) => db.receipts.delete(id), []);

  const addLocationTransfer = useCallback(async (data: LocationTransfer) => db.locationTransfers.add(data), []);
  const addAdjustment = useCallback(async (data: StockAdjustment) => db.adjustments.add(data), []);
  
  const addPurchaseReturn = useCallback(async (data: PurchaseReturn) => db.purchaseReturns.add(data), []);
  const addSaleReturn = useCallback(async (data: SaleReturn) => db.saleReturns.add(data), []);

  const addLedgerEntry = useCallback(async (data: LedgerEntry[] | LedgerEntry) => db.ledger.bulkAdd(Array.isArray(data) ? data : [data]), []);
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


export const useMasters = () => {
    const masters = useLiveQuery(() => db.masters.toArray()) as MasterItem[] | undefined;

    const masterData = useMemo(() => {
      const grouped: { [key in MasterItemType]?: MasterItem[] } = {};
      (masters || []).forEach(m => {
          if (!grouped[m.type]) {
              grouped[m.type] = [];
          }
          grouped[m.type]!.push(m);
      });
      return grouped;
    }, [masters]);

    const isMastersLoaded = masters !== undefined;

    const addOrUpdateMaster = useCallback(async (item: MasterItem) => db.masters.put(item), []);
    const getAllMasters = useCallback(() => masters || [], [masters]);

    return {
        masters: masters || [],
        masterData,
        customers: masterData.Customer || [],
        suppliers: masterData.Supplier || [],
        agents: masterData.Agent || [],
        transporters: masterData.Transporter || [],
        warehouses: masterData.Warehouse || [],
        brokers: masterData.Broker || [],
        expenses: masterData.Expense || [],
        addOrUpdateMaster,
        getAllMasters,
        isMastersLoaded,
    };
};
