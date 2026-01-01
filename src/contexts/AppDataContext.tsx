"use client";

import React, { createContext, useCallback, useEffect, useState, useMemo, useContext } from 'react';
import { deriveAllTransactions } from '@/lib/derives';
import { loadEvents, addEvent as addEventToStore, setHasUnsavedChanges, useLiveEvents } from '@/lib/eventStore';
import type { 
  TransactionEvent,
  Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, Payment, Receipt, LedgerEntry, MasterItem, AggregatedInventoryItem
} from '@/lib/types';
import type { AppState, AppDispatch } from '@/hooks/useAppState';
import { calculateInventory } from '@/lib/inventoryEngine';

const AppDataContext = createContext<{
  state: AppState;
  dispatch: AppDispatch;
} | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const events = useLiveEvents(); // This is now a live query from Dexie
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);
  const [hasUnsavedChangesState, _setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if(events !== undefined && !isInitialized) {
      setIsInitialized(true);
    }
  }, [events, isInitialized]);

  // Derive state from events
  const derivedState = useMemo(() => {
    return deriveAllTransactions(events || []);
  }, [events]);

  const inventory = useMemo(() => {
    if (!isInitialized) return [];
    return calculateInventory(
      derivedState.purchases,
      derivedState.sales,
      derivedState.adjustments,
      derivedState.locationTransfers,
      derivedState.purchaseReturns,
      derivedState.saleReturns
    );
  }, [isInitialized, derivedState]);

  useEffect(() => {
     // This effect now simply watches for the derived state and inventory to be ready.
    if (isInitialized) {
      setIsCalculating(false);
    }
  }, [derivedState, inventory, isInitialized]);

  const state: AppState = {
    ...derivedState,
    inventory,
    events: events || [],
    isLoaded: isInitialized,
    isInitialized,
    isCalculating,
    hasUnsavedChanges: hasUnsavedChangesState,
    getAllMasters: useCallback(() => {
      const all: MasterItem[] = [];
      if (derivedState.masterData) {
        Object.values(derivedState.masterData).forEach(arr => all.push(...(arr || [])));
      }
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
    // These setters are now dummies as state is derived directly from events
    setPurchases: (updater) => { /* Managed by events */ },
    setSales: (updater) => { /* Managed by events */ },
    setPurchaseReturns: (updater) => { /* Managed by events */ },
    setSaleReturns: (updater) => { /* Managed by events */ },
  }), [setHasUnsavedChangesCallback]);
  
  if (!isInitialized) {
    // You can return a global loading spinner here if you want
    return null;
  }

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
