
"use client";

import React, { createContext, useCallback, useEffect, useState, useMemo, useContext } from 'react';
import { deriveAllTransactions } from '@/lib/derives';
import { loadEvents, addEvent as addEventToStore, onEventsChange, getEvents, setHasUnsavedChanges } from '@/lib/eventStore';
import { calculateInventory } from '@/lib/inventoryEngine';
import type { 
  TransactionEvent,
  Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, Payment, Receipt, LedgerEntry, MasterItem, AggregatedInventoryItem
} from '@/lib/types';
import type { AppState, AppDispatch } from '@/hooks/useAppState';

const AppDataContext = createContext<{
  state: AppState;
  dispatch: AppDispatch;
} | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);
  const [hasUnsavedChangesState, _setHasUnsavedChanges] = useState(false);

  // Derive state from events
  const derivedState = useMemo(() => {
    setIsCalculating(true); // Start calculation
    const result = deriveAllTransactions(events);
    const inventory = calculateInventory(
        result.purchases,
        result.sales,
        result.adjustments,
        result.locationTransfers,
        result.purchaseReturns,
        result.saleReturns
    );
    return { ...result, inventory };
  }, [events]);
  
  // Effect to finish calculation state change
  useEffect(() => {
    if (derivedState) {
        setIsCalculating(false);
    }
  }, [derivedState]);

  useEffect(() => {
    const handleEvents = (newEvents: TransactionEvent[]) => {
      setEvents(newEvents);
      if (!isLoaded) setIsLoaded(true);
    };

    const unsubscribe = onEventsChange(handleEvents);
    
    // Initial load
    handleEvents(getEvents());

    return () => unsubscribe();
  }, [isLoaded]);

  const state: AppState = {
    ...derivedState,
    events,
    isLoaded,
    isInitialized: isLoaded,
    isCalculating,
    hasUnsavedChanges: hasUnsavedChangesState,
    getAllMasters: useCallback(() => {
      const all: MasterItem[] = [];
      Object.values(derivedState.masterData).forEach(arr => all.push(...(arr || [])));
      return all;
    }, [derivedState.masterData]),
  };

  const setHasUnsavedChangesCallback = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
    _setHasUnsavedChanges(hasChanges);
  }, []);

  const dispatch: AppDispatch = useMemo(() => ({
    addPurchase: (payload) => addEventToStore({ type: 'PURCHASE_CREATED', payload }),
    updatePurchase: (payload) => addEventToStore({ type: 'PURCHASE_UPDATED', payload }),
    deletePurchase: (id) => addEventToStore({ type: 'PURCHASE_DELETED', payload: { id } }),
    addSale: (payload) => addEventToStore({ type: 'SALE_CREATED', payload }),
    updateSale: (payload) => addEventToStore({ type: 'SALE_UPDATED', payload }),
    deleteSale: (id) => addEventToStore({ type: 'SALE_DELETED', payload: { id } }),
    addPayment: (payload) => addEventToStore({ type: 'PAYMENT_CREATED', payload }),
    updatePayment: (payload) => addEventToStore({ type: 'PAYMENT_UPDATED', payload }),
    deletePayment: (id) => addEventToStore({ type: 'PAYMENT_DELETED', payload: { id } }),
    addReceipt: (payload) => addEventToStore({ type: 'RECEIPT_CREATED', payload }),
    updateReceipt: (payload) => addEventToStore({ type: 'RECEIPT_UPDATED', payload }),
    deleteReceipt: (id) => addEventToStore({ type: 'RECEIPT_DELETED', payload: { id } }),
    addTransfer: (payload) => addEventToStore({ type: 'TRANSFER_CREATED', payload }),
    addAdjustment: (payload) => addEventToStore({ type: 'ADJUSTMENT_CREATED', payload }),
    addReturn: (payload) => addEventToStore({ type: 'RETURN_CREATED', payload }),
    addOrUpdateMaster: (payload) => addEventToStore({ type: 'MASTER_UPSERTED', payload }),
    loadEvents,
    setHasUnsavedChanges: setHasUnsavedChangesCallback,
    // These setters are now dummies because state is derived from events
    setPurchases: (updater) => { /* Managed by events */ },
    setSales: (updater) => { /* Managed by events */ },
    setPurchaseReturns: (updater) => { /* Managed by events */ },
    setSaleReturns: (updater) => { /* Managed by events */ },
  }), [setHasUnsavedChangesCallback]);
  

  return (
    <AppDataContext.Provider value={{ state, dispatch }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppDataContext = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppDataContext must be used within an AppDataProvider');
  }
  return context;
};
