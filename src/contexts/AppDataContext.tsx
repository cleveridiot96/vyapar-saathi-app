
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/db';
import type { 
  Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, Payment, Receipt, LedgerEntry, MasterItem, MasterItemType
} from '@/lib/types';
import type { AppState, AppDispatch } from '@/hooks/useAppState';
import { calculateInventory } from '@/lib/inventoryEngine';
import { groupMasters } from '@/lib/utils';
import { useAuth } from './PasswordContext';

const AppDataContext = createContext<{
  state: AppState;
  dispatch: AppDispatch;
} | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // --- STATE DEFINITIONS ---
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
    let mounted = true;

    const loadData = async () => {
      // If not authenticated, clear data
      if (!isAuthenticated) {
        if (isLoaded) {
            setPurchases([]); setSales([]); setAdjustments([]);
            setLocationTransfers([]); setPurchaseReturns([]); setSaleReturns([]);
            setPayments([]); setReceipts([]); setLedger([]);
            setMasterData({ Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: [] });
            setIsLoaded(false);
        }
        return;
      }

      try {
        // Fetch all data in parallel
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

        if (!mounted) return;

        // Sort Helper
        const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

        // Update State
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
        console.error("Data load error:", error);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [isAuthenticated, isLoaded]);

  // --- INVENTORY LOGIC ---
  const inventory = useMemo(() => {
    if (!isLoaded) return [];
    return calculateInventory(
      purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns
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
    isCalculating: false,
    hasUnsavedChanges: false,
    getAllMasters: () => {
        const all: MasterItem[] = [];
        Object.values(masterData).forEach(arr => all.push(...(arr || [])));
        return all;
    },
    events: [],
  };

  // --- DISPATCH ACTIONS ---
  const dispatch: AppDispatch = useMemo(() => {
    const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

    return {
      // PURCHASES: Write to DB, then fetch fresh list to ensure UI updates
      addPurchase: async (payload) => { 
        await db.purchases.add(payload); 
        // FIX: Re-fetch to guarantee state update
        const updated = await db.purchases.toArray();
        setPurchases(updated.sort(sortByDateDesc));
      },
      updatePurchase: async (payload) => { 
        await db.purchases.put(payload); 
        const updated = await db.purchases.toArray();
        setPurchases(updated.sort(sortByDateDesc));
      },
      deletePurchase: async (id) => { 
        await db.purchases.delete(id); 
        setPurchases(p => p.filter(i => i.id !== id)); 
      },
      
      // SALES
      addSale: async (payload) => { 
        await db.sales.add(payload); 
        const updated = await db.sales.toArray();
        setSales(updated.sort(sortByDateDesc));
      },
      updateSale: async (payload) => { 
        await db.sales.put(payload); 
        const updated = await db.sales.toArray();
        setSales(updated.sort(sortByDateDesc));
      },
      deleteSale: async (id) => { 
        await db.sales.delete(id); 
        setSales(s => s.filter(i => i.id !== id)); 
      },

      // PAYMENTS
      addPayment: async (payload) => { 
        await db.payments.add(payload); 
        const updated = await db.payments.toArray();
        setPayments(updated.sort(sortByDateDesc));
      },
      updatePayment: async (payload) => { 
        await db.payments.put(payload); 
        const updated = await db.payments.toArray();
        setPayments(updated.sort(sortByDateDesc));
      },
      deletePayment: async (id) => { 
        await db.payments.delete(id); 
        setPayments(p => p.filter(i => i.id !== id)); 
      },

      // RECEIPTS
      addReceipt: async (payload) => { 
        await db.receipts.add(payload); 
        const updated = await db.receipts.toArray();
        setReceipts(updated.sort(sortByDateDesc));
      },
      updateReceipt: async (payload) => { 
        await db.receipts.put(payload); 
        const updated = await db.receipts.toArray();
        setReceipts(updated.sort(sortByDateDesc));
      },
      deleteReceipt: async (id) => { 
        await db.receipts.delete(id); 
        setReceipts(r => r.filter(i => i.id !== id)); 
      },

      // OTHERS
      addTransfer: async (payload) => { 
        await db.locationTransfers.add(payload); 
        setLocationTransfers(t => [payload, ...t]); 
      },
      addAdjustment: async (payload) => { 
        await db.adjustments.add(payload); 
        setAdjustments(a => [payload, ...a]); 
      },
      addReturn: async (payload) => {
        if ('originalPurchaseId' in payload) {
          await db.purchaseReturns.add(payload);
          setPurchaseReturns(pr => [payload, ...pr]);
        } else {
          await db.saleReturns.add(payload as SaleReturn);
          setSaleReturns(sr => [...sr, payload as SaleReturn]);
        }
      },
      addOrUpdateMaster: async (payload) => { 
        await db.masters.put(payload);
        const allMasters = await db.masters.toArray();
        setMasterData(groupMasters(allMasters));
      },
      
      loadEvents: () => {}, 
      setHasUnsavedChanges: () => {},
      setPurchases: () => {}, 
      setSales: () => {},
      setPurchaseReturns: () => {},
      setSaleReturns: () => {},
    };
  }, [setPurchases, setSales, setPurchaseReturns, setSaleReturns]);
  
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

    