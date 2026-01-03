
"use client";

import React, { createContext, useCallback, useEffect, useState, useMemo, useContext } from 'react';
import { db } from '@/lib/db';
import type { 
  Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, Payment, Receipt, LedgerEntry, MasterItem, AggregatedInventoryItem, MasterItemType
} from '@/lib/types';
import type { AppState, AppDispatch } from '@/hooks/useAppState';
import { calculateInventory } from '@/lib/inventoryEngine';
import { groupMasters } from '@/lib/utils';
import { useAuth } from './PasswordContext';

const AppDataContext = createContext<{
  state: AppState;
  dispatch: AppDispatch;
} | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);

  // State containers
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

  // --- DATA LOADING ---
  useEffect(() => {
    if (!isAuthenticated) {
        if(isLoaded) { 
            setPurchases([]);
            setSales([]);
            setAdjustments([]);
            setLocationTransfers([]);
            setPurchaseReturns([]);
            setSaleReturns([]);
            setPayments([]);
            setReceipts([]);
            setLedger([]);
            setMasterData({ Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: [] });
            setIsLoaded(false);
        }
        return;
    };
    
    const loadData = async () => {
      setIsCalculating(true);
      try {
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

        // Helper to ensure stable sorting
        const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

        setMasterData(groupMasters(allMasters));
        setPurchases(allPurchases.sort(sortByDateDesc));
        setSales(allSales.sort(sortByDateDesc));
        setAdjustments(allAdjustments);
        setLocationTransfers(allTransfers);
        setPurchaseReturns(allPurchaseReturns);
        setSaleReturns(allSaleReturns);
        setPayments(allPayments.sort(sortByDateDesc));
        setReceipts(allReceipts.sort(sortByDateDesc));
        setLedger(allLedger);
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    if (!isLoaded) {
      loadData();
    }
  }, [isAuthenticated, isLoaded]);

  // --- INVENTORY CALCULATION ---
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

  // --- STATE OBJECT ---
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
    hasUnsavedChanges: false,
    getAllMasters: useCallback(() => {
      const all: MasterItem[] = [];
      Object.values(masterData).forEach(arr => all.push(...(arr || [])));
      return all;
    }, [masterData]),
    events: [],
  };

  // --- DISPATCH LOGIC (THE FIX) ---
  const dispatch: AppDispatch = useMemo(() => {
    
    // Helper for sorting
    const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

    return {
      // PURCHASES: Write to DB first, then update State
      addPurchase: async (payload) => { 
        const id = await db.purchases.add(payload); 
        // CRITICAL: Create a NEW object with the ID attached from DB
        const newPurchase = { ...payload, id }; 
        setPurchases(p => [...p, newPurchase].sort(sortByDateDesc)); 
      },
      
      updatePurchase: async (payload) => { 
        await db.purchases.put(payload); 
        setPurchases(p => p.map(i => i.id === payload.id ? payload : i).sort(sortByDateDesc)); 
      },
      
      deletePurchase: async (id) => { 
        await db.purchases.delete(id); 
        setPurchases(p => p.filter(i => i.id !== id)); 
      },
      
      // SALES
      addSale: async (payload) => { 
        const id = await db.sales.add(payload); 
        const newSale = { ...payload, id }; 
        setSales(s => [...s, newSale].sort(sortByDateDesc)); 
      },
      
      updateSale: async (payload) => { 
        await db.sales.put(payload); 
        setSales(s => s.map(i => i.id === payload.id ? payload : i).sort(sortByDateDesc)); 
      },
      
      deleteSale: async (id) => { 
        await db.sales.delete(id); 
        setSales(s => s.filter(i => i.id !== id)); 
      },

      // PAYMENTS
      addPayment: async (payload) => { 
        const id = await db.payments.add(payload); 
        const newPayment = { ...payload, id }; 
        setPayments(p => [...p, newPayment].sort(sortByDateDesc)); 
      },
      
      updatePayment: async (payload) => { 
        await db.payments.put(payload); 
        setPayments(p => p.map(i => i.id === payload.id ? payload : i).sort(sortByDateDesc)); 
      },
      
      deletePayment: async (id) => { 
        await db.payments.delete(id); 
        setPayments(p => p.filter(i => i.id !== id)); 
      },

      // RECEIPTS
      addReceipt: async (payload) => { 
        const id = await db.receipts.add(payload); 
        const newReceipt = { ...payload, id }; 
        setReceipts(r => [...r, newReceipt].sort(sortByDateDesc)); 
      },
      
      updateReceipt: async (payload) => { 
        await db.receipts.put(payload); 
        setReceipts(r => r.map(i => i.id === payload.id ? payload : i).sort(sortByDateDesc)); 
      },
      
      deleteReceipt: async (id) => { 
        await db.receipts.delete(id); 
        setReceipts(r => r.filter(i => i.id !== id)); 
      },

      // TRANSFERS & ADJUSTMENTS (Keeping simple prepend for these as they are less frequent lists usually)
      addTransfer: async (payload) => { 
        await db.locationTransfers.add(payload); 
        setLocationTransfers(t => [payload, ...t]); 
      },
      
      addAdjustment: async (payload) => { 
        await db.adjustments.add(payload); 
        setAdjustments(a => [payload, ...a]); 
      },
      
      // RETURNS
      addReturn: async (payload) => {
        if ('originalPurchaseId' in payload) {
          await db.purchaseReturns.add(payload);
          setPurchaseReturns(pr => [payload, ...pr]);
        } else {
          await db.saleReturns.add(payload as SaleReturn);
          setSaleReturns(sr => [...sr, payload as SaleReturn]);
        }
      },

      // MASTERS
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
    };
  }, [setPurchases, setSales, setPurchaseReturns, setSaleReturns]); // Dependencies
  
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
