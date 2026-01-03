"use client";
import { create } from 'zustand';
import {
  type Purchase, type Sale, type Payment, type Receipt, type LocationTransfer,
  type PurchaseReturn, type SaleReturn, type MasterItem, type StockAdjustment,
  type MasterItemType, type LedgerEntry
} from '@/lib/types';
import { MASTER_TYPES_CONFIG } from '@/lib/constants';
import { useTransactions as useLiveTransactions, useMasters as useLiveMasters } from './useTransactions';
import { useMemo } from 'react';

// This central store combines live data from Dexie with dispatch actions.
// It is intended as a bridge while refactoring away from a monolithic Zustand store.

type AppState = {
  isLoaded: boolean;
  purchases: Purchase[];
  sales: Sale[];
  payments: Payment[];
  receipts: Receipt[];
  locationTransfers: LocationTransfer[];
  purchaseReturns: PurchaseReturn[];
  saleReturns: SaleReturn[];
  adjustments: StockAdjustment[];
  ledger: LedgerEntry[];
  masterData: { [key in MasterItemType]: MasterItem[] };
  hasUnsavedChanges: boolean;
};

type AppDispatch = {
  addPurchase: (data: Purchase) => void;
  updatePurchase: (data: Purchase) => void;
  deletePurchase: (id: string) => void;

  addSale: (data: Sale) => void;
  updateSale: (data: Sale) => void;
  deleteSale: (id: string) => void;
  
  addPayment: (data: Payment) => void;
  updatePayment: (data: Payment) => void;
  deletePayment: (id: string) => void;
  
  addReceipt: (data: Receipt) => void;
  updateReceipt: (data: Receipt) => void;
  deleteReceipt: (id: string) => void;

  addLocationTransfer: (data: LocationTransfer) => void;
  addAdjustment: (data: StockAdjustment) => void;
  
  addPurchaseReturn: (data: PurchaseReturn) => void;
  addSaleReturn: (data: SaleReturn) => void;
  
  addLedgerEntry: (data: LedgerEntry[] | LedgerEntry) => void;
  removeLedgerEntries: (voucherId: string) => void;

  addOrUpdateMaster: (item: MasterItem) => void;
  getAllMasters: () => MasterItem[];
};


export const useAppState = (): AppState => {
  const { purchases, sales, payments, receipts, locationTransfers, purchaseReturns, saleReturns, adjustments, ledger, isTransactionsLoaded } = useLiveTransactions();
  const { masterData, isMastersLoaded } = useLiveMasters();

  return useMemo(() => ({
    isLoaded: isTransactionsLoaded && isMastersLoaded,
    purchases: purchases || [],
    sales: sales || [],
    payments: payments || [],
    receipts: receipts || [],
    locationTransfers: locationTransfers || [],
    purchaseReturns: purchaseReturns || [],
    saleReturns: saleReturns || [],
    adjustments: adjustments || [],
    ledger: ledger || [],
    masterData,
    hasUnsavedChanges: false, // This is now managed implicitly by Dexie
  }), [
    isTransactionsLoaded, isMastersLoaded, purchases, sales, payments, receipts,
    locationTransfers, purchaseReturns, saleReturns, adjustments, ledger, masterData
  ]);
};

export const useAppDispatch = (): AppDispatch => {
    const {
        addPurchase, updatePurchase, deletePurchase,
        addSale, updateSale, deleteSale,
        addPayment, updatePayment, deletePayment,
        addReceipt, updateReceipt, deleteReceipt,
        addLocationTransfer, addAdjustment, addPurchaseReturn, addSaleReturn,
        addLedgerEntry, removeLedgerEntries
    } = useLiveTransactions();
    const { addOrUpdateMaster, getAllMasters } = useLiveMasters();
    
    return {
        addPurchase, updatePurchase, deletePurchase,
        addSale, updateSale, deleteSale,
        addPayment, updatePayment, deletePayment,
        addReceipt, updateReceipt, deleteReceipt,
        addLocationTransfer, addAdjustment, addPurchaseReturn, addSaleReturn,
        addLedgerEntry, removeLedgerEntries,
        addOrUpdateMaster, getAllMasters
    };
};
