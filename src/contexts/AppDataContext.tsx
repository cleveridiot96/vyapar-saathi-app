"use client";

import React, { createContext, useCallback, useEffect, useState, useMemo, useContext } from 'react';
import { db } from '@/lib/db';
import type { 
  Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, Payment, Receipt, LedgerEntry, MasterItem, AggregatedInventoryItem, MasterItemType
} from '@/lib/types';
import type { AppState, AppDispatch } from '@/hooks/useAppState';
import { calculateInventory } from '@/lib/inventoryEngine';
import { groupMasters } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';

const AppDataContext = createContext<{
  state: AppState;
  dispatch: AppDispatch;
} | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const isHydrated = useHydrated();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);

  // Direct state for all our data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [locationTransfers, setLocationTransfers] = useState<LocationTransfer[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [masterData, setMasterData] = useState<AppState['masterData']>({
    Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: []
  });

  useEffect(() => {
    if (!isHydrated) return;
    // Load all data from Dexie on initial mount
    const loadData = async () => {
      setIsCalculating(true);
      const [
        allMasters, allPurchases, allSales, allAdjustments, allTransfers,
        allPurchaseReturns, allSaleReturns, allPayments, allReceipts, allLedger
      ] = await Promise.all([
        db.masters.toArray(),
        db.purchases.toArray(),
        db.sales.toArray(),
        db.adjustments.toArray(),
        db.locationTransfers.toArray(),
        db.purchaseReturns.toArray(),
        db.saleReturns.toArray(),
        db.payments.toArray(),
        db.receipts.toArray(),
        db.ledger.toArray(),
      ]);

      setMasterData(groupMasters(allMasters));
      setPurchases(allPurchases);
      setSales(allSales);
      setAdjustments(allAdjustments);
      setLocationTransfers(allTransfers);
      setPurchaseReturns(allPurchaseReturns);
      setSaleReturns(allSaleReturns);
      setPayments(allPayments);
      setReceipts(allReceipts);
      setLedger(allLedger);
      
      setIsLoaded(true);
      setIsCalculating(false);
    };

    loadData();
  }, [isHydrated]);

  const inventory = useMemo(() => {
    if (!isLoaded) return [];
    return calculateInventory(
      purchases,
      sales,
      adjustments,
      locationTransfers,
      purchaseReturns,
      saleReturns
    );
  }, [isLoaded, purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns]);

  const state: AppState = {
    purchases,
    sales,
    adjustments,
    locationTransfers,
    purchaseReturns,
    saleReturns,
    payments,
    receipts,
    ledger,
    masterData,
    inventory,
    isLoaded,
    isInitialized: isLoaded,
    isCalculating,
    hasUnsavedChanges: false, // Direct DB ops mean we're always "saved"
    getAllMasters: useCallback(() => {
      const all: MasterItem[] = [];
      Object.values(masterData).forEach(arr => all.push(...(arr || [])));
      return all;
    }, [masterData]),
    events: [], // Events are no longer the source of truth
  };

  const dispatch: AppDispatch = useMemo(() => ({
    addPurchase: async (payload) => { await db.purchases.add(payload); setPurchases(p => [payload, ...p]); },
    updatePurchase: async (payload) => { await db.purchases.put(payload); setPurchases(p => p.map(i => i.id === payload.id ? payload : i)); },
    deletePurchase: async (id) => { await db.purchases.delete(id); setPurchases(p => p.filter(i => i.id !== id)); },
    
    addSale: async (payload) => { await db.sales.add(payload); setSales(s => [payload, ...s]); },
    updateSale: async (payload) => { await db.sales.put(payload); setSales(s => s.map(i => i.id === payload.id ? payload : i)); },
    deleteSale: async (id) => { await db.sales.delete(id); setSales(s => s.filter(i => i.id !== id)); },

    addPayment: async (payload) => { await db.payments.add(payload); setPayments(p => [payload, ...p]); },
    updatePayment: async (payload) => { await db.payments.put(payload); setPayments(p => p.map(i => i.id === payload.id ? payload : i)); },
    deletePayment: async (id) => { await db.payments.delete(id); setPayments(p => p.filter(i => i.id !== id)); },

    addReceipt: async (payload) => { await db.receipts.add(payload); setReceipts(r => [payload, ...r]); },
    updateReceipt: async (payload) => { await db.receipts.put(payload); setReceipts(r => r.map(i => i.id === payload.id ? payload : i)); },
    deleteReceipt: async (id) => { await db.receipts.delete(id); setReceipts(r => r.filter(i => i.id !== id)); },

    addTransfer: async (payload) => { await db.locationTransfers.add(payload); setLocationTransfers(t => [payload, ...t]); },
    addAdjustment: async (payload) => { await db.adjustments.add(payload); setAdjustments(a => [payload, ...a]); },
    addReturn: async (payload) => {
      if ('originalPurchaseId' in payload) {
        await db.purchaseReturns.add(payload);
        setPurchaseReturns(pr => [payload, ...pr]);
      } else {
        await db.saleReturns.add(payload as SaleReturn);
        setSaleReturns(sr => [payload as SaleReturn, ...sr]);
      }
    },
    addOrUpdateMaster: async (payload) => { 
        await db.masters.put(payload);
        setMasterData(prev => {
            const newMasters = { ...prev };
            const type = payload.type as MasterItemType;
            if (!newMasters[type]) newMasters[type] = [];
            
            const existingIndex = newMasters[type].findIndex(m => m.id === payload.id);
            if (existingIndex > -1) {
                newMasters[type][existingIndex] = payload;
            } else {
                newMasters[type].push(payload);
            }
            return newMasters;
        });
    },
    loadEvents: (events) => { /* No longer used */ },
    setHasUnsavedChanges: (hasChanges) => { /* No longer used */ },
    setPurchases,
    setSales,
    setPurchaseReturns,
    setSaleReturns,
  }), []);
  
  if (!isHydrated) {
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
