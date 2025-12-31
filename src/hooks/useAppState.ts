"use client";

import { createContext, useContext, useMemo, useCallback } from 'react';
import type { 
  AggregatedInventoryItem, 
  Purchase, 
  Sale, 
  StockAdjustment, 
  LocationTransfer,
  PurchaseReturn,
  SaleReturn,
  Payment,
  Receipt,
  LedgerEntry,
  MasterItem,
  MasterItemType,
  TransactionEvent
} from '@/lib/types';
import { useAppDataContext } from '@/contexts/AppDataContext';

export interface AppState {
  events: TransactionEvent[];
  purchases: Purchase[];
  sales: Sale[];
  adjustments: StockAdjustment[];
  locationTransfers: LocationTransfer[];
  purchaseReturns: PurchaseReturn[];
  saleReturns: SaleReturn[];
  payments: Payment[];
  receipts: Receipt[];
  ledger: LedgerEntry[];
  inventory: AggregatedInventoryItem[];
  isInitialized: boolean;
  isLoaded: boolean;
  isCalculating: boolean;
  hasUnsavedChanges: boolean;
  masterData: {
    Customer: MasterItem[];
    Supplier: MasterItem[];
    Agent: MasterItem[];
    Transporter: MasterItem[];
    Warehouse: MasterItem[];
    Broker: MasterItem[];
    Expense: MasterItem[];
    Product: MasterItem[];
  };
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
  addReturn: (ret: PurchaseReturn | SaleReturn) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (receipt: Receipt) => void;
  deleteReceipt: (id: string) => void;
  addOrUpdateMaster: (master: MasterItem) => void;
  loadEvents: (events: TransactionEvent[]) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setPurchases: (updater: React.SetStateAction<Purchase[]>) => void;
  setSales: (updater: React.SetStateAction<Sale[]>) => void;
  setPurchaseReturns: (updater: React.SetStateAction<PurchaseReturn[]>) => void;
  setSaleReturns: (updater: React.SetStateAction<SaleReturn[]>) => void;
};


export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export function useAppState(): AppState {
  const context = useAppDataContext();
  if (!context) {
    throw new Error('useAppState must be used within an AppDataProvider');
  }
  return context.state;
}

export function useAppDispatch(): AppDispatch {
  const context = useAppDataContext();
  if (!context) {
    throw new Error('useAppDispatch must be used within an AppDataProvider');
  }
  return context.dispatch;
}
