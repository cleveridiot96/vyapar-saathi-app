"use client";

import { useEffect, useState } from 'react';
import { getEvents, onEventsChange, initializeEventStore, addEvent } from '@/lib/eventStore';
import { deriveAllTransactions } from '@/lib/derives';
import type { TransactionEvent } from '@/lib/eventStore';
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
import { calculateInventory } from '@/lib/inventoryEngine';

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
  inventory: AggregatedInventoryItem[];
  isLoaded: boolean;
  isCalculating: boolean;
}

let globalAppState: AppState = {
  events: [],
  purchases: [],
  sales: [],
  adjustments: [],
  locationTransfers: [],
  purchaseReturns: [],
  saleReturns: [],
  payments: [],
  receipts: [],
  ledger: [],
  masterData: {
      Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: []
  },
  inventory: [],
  isLoaded: false,
  isCalculating: false,
};

let listeners: Set<() => void> = new Set();
let worker: Worker | null = null;
let isInitialized = false;

const initializeWorker = () => {
    if (typeof window === 'undefined' || worker) return;
    try {
        worker = new Worker(new URL('@/lib/inventory.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<AggregatedInventoryItem[]>) => {
            globalAppState = { ...globalAppState, inventory: e.data, isCalculating: false };
            listeners.forEach(listener => listener());
        };
    } catch (error) {
        console.error("Failed to initialize worker:", error);
    }
};

const updateState = (events: TransactionEvent[]) => {
    const derived = deriveAllTransactions(events);
    globalAppState = { ...globalAppState, events, ...derived, isLoaded: true, isCalculating: true };
    
    if (worker) {
        worker.postMessage(events);
    } else {
        // Fallback to main thread calculation if worker fails
        const inventory = calculateInventory(derived.purchases, derived.sales, derived.adjustments, derived.locationTransfers, derived.purchaseReturns, derived.saleReturns);
        globalAppState = { ...globalAppState, inventory, isCalculating: false };
    }
    
    listeners.forEach(listener => listener());
};

const init = async () => {
    if (isInitialized) return;
    isInitialized = true;
    initializeWorker();
    await initializeEventStore();
    const events = getEvents();
    updateState(events);
    onEventsChange(updateState);
};

init();

export function useAppState(): AppState {
  const [state, setState] = useState<AppState>(globalAppState);

  useEffect(() => {
    const listener = () => setState({ ...globalAppState });
    listeners.add(listener);
    
    // Ensure state is up-to-date in case it was initialized before this component mounted
    if (state.isLoaded !== globalAppState.isLoaded) {
      setState(globalAppState);
    }

    return () => {
      listeners.delete(listener);
    };
  }, [state.isLoaded]);

  return state;
}

export function useAppDispatch() {
  return {
    addPurchase: (purchase: Purchase) => addEvent({ type: 'PURCHASE_CREATED', payload: purchase }),
    updatePurchase: (purchase: Purchase) => addEvent({ type: 'PURCHASE_UPDATED', payload: purchase }),
    deletePurchase: (id: string) => addEvent({ type: 'PURCHASE_DELETED', payload: { id } }),
    addSale: (sale: Sale) => addEvent({ type: 'SALE_CREATED', payload: sale }),
    updateSale: (sale: Sale) => addEvent({ type: 'SALE_UPDATED', payload: sale }),
    deleteSale: (id: string) => addEvent({ type: 'SALE_DELETED', payload: { id } }),
    addTransfer: (transfer: LocationTransfer) => addEvent({ type: 'TRANSFER_CREATED', payload: transfer }),
    addAdjustment: (adj: StockAdjustment) => addEvent({ type: 'ADJUSTMENT_CREATED', payload: adj }),
    addPayment: (payment: Payment) => addEvent({ type: 'PAYMENT_CREATED', payload: payment }),
    updatePayment: (payment: Payment) => addEvent({ type: 'PAYMENT_UPDATED', payload: payment }),
    deletePayment: (id: string) => addEvent({ type: 'PAYMENT_DELETED', payload: { id } }),
    addReceipt: (receipt: Receipt) => addEvent({ type: 'RECEIPT_CREATED', payload: receipt }),
    updateReceipt: (receipt: Receipt) => addEvent({ type: 'RECEIPT_UPDATED', payload: receipt }),
    deleteReceipt: (id: string) => addEvent({ type: 'RECEIPT_DELETED', payload: { id } }),
    addReturn: (ret: PurchaseReturn | SaleReturn) => addEvent({ type: 'RETURN_CREATED', payload: ret }),
    addOrUpdateMaster: (master: MasterItem) => addEvent({ type: 'MASTER_UPSERTED', payload: master }),
    addLedgerEntry: (entries: LedgerEntry | LedgerEntry[]) => addEvent({ type: 'LEDGER_ENTRY_CREATED', payload: Array.isArray(entries) ? entries : [entries] }),
    removeLedgerEntries: (voucherId: string) => addEvent({ type: 'LEDGER_ENTRY_DELETED', payload: { voucherId } }),
  };
}
