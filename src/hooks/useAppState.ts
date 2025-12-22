"use client";

import { createContext, useContext } from 'react';
import type { 
  Purchase, 
  Sale, 
  StockAdjustment, 
  LocationTransfer,
  PurchaseReturn,
  SaleReturn,
  Payment,
  Receipt,
  MasterItem,
  AggregatedInventoryItem,
  LedgerEntry,
} from '@/lib/types';
import type { DerivedTransactions } from '@/lib/derives';
import type { TransactionEvent } from '@/lib/eventStore';

export interface AppState extends DerivedTransactions {
  events: TransactionEvent[];
  inventory: AggregatedInventoryItem[];
  isInitialized: boolean;
  isCalculating: boolean;
  isMasterDataLoaded: boolean;
  isTransactionsLoaded: boolean;
  getAllMasters: () => MasterItem[];
}

export type AppDispatch = {
    addPurchase: (purchase: Purchase) => void;
    updatePurchase: (purchase: Purchase) => void;
    deletePurchase: (id: string) => void;
    addSale: (sale: Sale) => void;
    updateSale: (sale: Sale) => void;
    deleteSale: (id: string) => void;
    addTransfer: (transfer: LocationTransfer) => void;
    addAdjustment: (adj: StockAdjustment) => void;
    addPayment: (payment: Payment) => void;
    updatePayment: (payment: Payment) => void;
    deletePayment: (id: string) => void;
    addReceipt: (receipt: Receipt) => void;
    updateReceipt: (receipt: Receipt) => void;
    deleteReceipt: (id: string) => void;
    addReturn: (ret: PurchaseReturn | SaleReturn) => void;
    setPurchases: (updater: React.SetStateAction<Purchase[]>) => void;
    setSales: (updater: React.SetStateAction<Sale[]>) => void;
    setSaleReturns: (updater: React.SetStateAction<SaleReturn[]>) => void;
    setPurchaseReturns: (updater: React.SetStateAction<PurchaseReturn[]>) => void;
    setLocationTransfers: (updater: React.SetStateAction<LocationTransfer[]>) => void;
    setPayments: (updater: React.SetStateAction<Payment[]>) => void;
    setReceipts: (updater: React.SetStateAction<Receipt[]>) => void;
    setAdjustments: (updater: React.SetStateAction<StockAdjustment[]>) => void;
    setLedger: (updater: React.SetStateAction<LedgerEntry[]>) => void;
    addOrUpdateMaster: (item: MasterItem) => void;
    addLedgerEntry: (entry: LedgerEntry | LedgerEntry[]) => void;
    removeLedgerEntries: (voucherId: string) => void;
};


export const AppStateContext = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<AppDispatch | null>(null);

export function useAppState() {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}

export function useAppDispatch() {
    const context = useContext(AppDispatchContext);
    if (!context) {
        throw new Error('useAppDispatch must be used within an AppStateProvider');
    }
    return context;
}
