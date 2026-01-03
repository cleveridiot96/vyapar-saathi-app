
"use client";
import { create } from 'zustand';
import {
  type Purchase, type Sale, type Payment, type Receipt, type LocationTransfer,
  type PurchaseReturn, type SaleReturn, type MasterItem, type StockAdjustment,
  type MasterItemType, type LedgerEntry
} from '@/lib/types';
import { MASTER_TYPES_CONFIG } from '@/lib/constants';

// This file is deprecated and will be removed.
// All state management is now handled by hooks in `useTransactions.ts`
// which interface directly with Dexie (IndexedDB).

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
  loadStore: (data: Partial<AppState>) => void;
  // This is a placeholder, real logic is in useTransactions
};

// This is a dummy store to prevent crashes in files that still import it.
// It will be removed once all components are refactored.
export const useAppStateStore = create<AppState & { dispatch: AppDispatch }>((set) => ({
  isLoaded: false,
  purchases: [],
  sales: [],
  payments: [],
  receipts: [],
  locationTransfers: [],
  purchaseReturns: [],
  saleReturns: [],
  adjustments: [],
  ledger: [],
  masterData: {
    Customer: [], Supplier: [], Agent: [], Broker: [],
    Transporter: [], Warehouse: [], Expense: [], Product: [],
  },
  hasUnsavedChanges: false,
  dispatch: {
    loadStore: (data) => set(state => ({ ...state, ...data, isLoaded: true })),
  }
}));

export const useAppState = () => useAppStateStore((state) => state);
export const useAppDispatch = () => useAppStateStore((state) => state.dispatch);
