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
};


export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  // Memoize derivative functions
  const memoizedGetAllMasters = useCallback(() => {
    if (!context.masterData) return [];
    return Object.values(context.masterData).flat();
  }, [context.masterData]);

  return useMemo(() => ({
    ...context,
    getAllMasters: memoizedGetAllMasters,
  }), [context, memoizedGetAllMasters]);
}

export function useAppDispatch(): AppDispatch & { hasUnsavedChanges: boolean; setHasUnsavedChanges: (val: boolean) => void; loadEvents: (events: any[]) => void; } {
  const context = useContext(AppDispatchContext);
  const stateContext = useContext(AppStateContext);
  if (!context || !stateContext) {
    throw new Error('useAppDispatch must be used within an AppStateProvider');
  }
  return {
    ...context,
    hasUnsavedChanges: stateContext.hasUnsavedChanges,
    setHasUnsavedChanges: context.setHasUnsavedChanges,
    loadEvents: context.loadEvents,
  };
}
