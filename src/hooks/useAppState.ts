"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getEvents, addEvent, onEventsChange, initializeEventStore } from '@/lib/eventStore';
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
  MasterItem,
  LedgerEntry
} from '@/lib/types';

interface AppState {
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

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
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
    inventory:  [],
    isLoaded:  false,
    isCalculating:  false,
  });

  const workerRef = React.useRef<Worker | null>(null);

  // Initialize on mount
  useEffect(() => {
    (async () => {
      // Load events from IndexedDB
      await initializeEventStore();
      
      // Initialize worker
      try {
        workerRef.current = new Worker(
          new URL('@/lib/inventory.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (e:  MessageEvent<AggregatedInventoryItem[]>) => {
          setState(prev => ({
            ...prev,
            inventory: e.data,
            isCalculating: false,
          }));
        };

        // Set initial state
        const events = getEvents();
        updateState(events);
      } catch (error) {
        console.error('Failed to initialize worker:', error);
        // Fallback:  Calculate on main thread
        const events = getEvents();
        updateState(events);
      }
    })();

    // Subscribe to events
    const unsubscribe = onEventsChange(updateState);
    return () => unsubscribe();
  }, []);

  const updateState = useCallback((events: TransactionEvent[]) => {
    const derived = deriveAllTransactions(events);
    
    setState(prev => ({
      ...prev,
      events,
      ...derived,
      isLoaded: true,
      isCalculating: true,
    }));

    // Offload calculation to worker
    if (workerRef.current) {
      workerRef.current.postMessage(events);
    }
  }, []);

  return (
    <AppStateContext.Provider value={state}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * Hook to use app state
 */
export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

/**
 * Hook to dispatch events
 */
export function useAppDispatch() {
  return {
    addPurchase: (purchase: Purchase) => addEvent({ type: 'PURCHASE_CREATED', payload: purchase }),
    updatePurchase: (purchase: Purchase) => addEvent({ type: 'PURCHASE_UPDATED', payload: purchase }),
    deletePurchase: (id: string) => addEvent({ type: 'PURCHASE_DELETED', payload: { id } }),
    addSale: (sale: Sale) => addEvent({ type: 'SALE_CREATED', payload:  sale }),
    updateSale: (sale: Sale) => addEvent({ type: 'SALE_UPDATED', payload: sale }),
    deleteSale: (id: string) => addEvent({ type: 'SALE_DELETED', payload: { id } }),
    addTransfer: (transfer: LocationTransfer) => addEvent({ type: 'TRANSFER_CREATED', payload: transfer }),
    addAdjustment: (adj: StockAdjustment) => addEvent({ type: 'ADJUSTMENT_CREATED', payload:  adj }),
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