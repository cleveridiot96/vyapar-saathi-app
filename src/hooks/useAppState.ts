
"use client";

import { createContext, useContext } from 'react';
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
  MasterItemType
} from '@/lib/types';
import type { TransactionEvent } from '@/lib/eventStore';

export interface AppState {
  events: TransactionEvent[];
  purchases: Purchase[];
  sales: Sale[];
  adjustments: StockAdjustment[];
  locationTransfers: LocationTransfer[]; // Changed from transfers
  purchaseReturns: PurchaseReturn[];
  saleReturns: SaleReturn[];
  payments: Payment[];
  receipts: Receipt[];
  ledger: LedgerEntry[];
  inventory: AggregatedInventoryItem[];
  isInitialized: boolean;
  isLoaded: boolean; // Add isLoaded
  isCalculating: boolean;
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
  setPurchases: (purchases: Purchase[]) => void;
  setSales: (sales: Sale[]) => void;
  setPurchaseReturns: (returns: PurchaseReturn[]) => void;
  setSaleReturns: (returns: SaleReturn[]) => void;
  setPayments: (payments: Payment[]) => void;
  setReceipts: (receipts: Receipt[]) => void;
  setLocationTransfers: (transfers: LocationTransfer[]) => void;
  setAdjustments: (adjustments: StockAdjustment[]) => void;
};


export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

export function useAppDispatch(): AppDispatch {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within an AppStateProvider');
  }
  return context;
}
