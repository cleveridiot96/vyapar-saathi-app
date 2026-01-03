"use client";

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { liveQuery } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks'; 
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

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const allMasters = useLiveQuery(() => db.masters.toArray(), []);
  const allPurchases = useLiveQuery(() => db.purchases.toArray(), [], { resultClass: Array });
  const allSales = useLiveQuery(() => db.sales.toArray(), [], { resultClass: Array });
  const allAdjustments = useLiveQuery(() => db.adjustments.toArray(), []);
  const allTransfers = useLiveQuery(() => db.locationTransfers.toArray(), []);
  const allPurchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), []);
  const allSaleReturns = useLiveQuery(() => db.saleReturns.toArray(), []);
  const allPayments = useLiveQuery(() => db.payments.toArray(), [], { resultClass: Array });
  const allReceipts = useLiveQuery(() => db.receipts.toArray(), [], { resultClass: Array });
  const allLedger = useLiveQuery(() => db.ledger.toArray(), []);

  // Helper to handle sorting
  const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

  // Memoize sorted data to prevent unnecessary re-renders
  const purchases = useMemo(() => allPurchases ? [...allPurchases].sort(sortByDateDesc) : [], [allPurchases]);
  const sales = useMemo(() => allSales ? [...allSales].sort(sortByDateDesc) : [], [allSales]);
  const payments = useMemo(() => allPayments ? [...allPayments].sort(sortByDateDesc) : [], [allPayments]);
  const receipts = useMemo(() => allReceipts ? [...allReceipts].sort(sortByDateDesc) : [], [allReceipts]);
  
  const adjustments = allAdjustments || [];
  const locationTransfers = allTransfers || [];
  const purchaseReturns = allPurchaseReturns || [];
  const saleReturns = allSaleReturns || [];
  const ledger = allLedger || [];
  
  const masterData = useMemo(() => {
    if (!allMasters) return { Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: [] };
    return groupMasters(allMasters);
  }, [allMasters]);

  const inventory = useMemo(() => {
    if (!purchases || !sales) return [];
    return calculateInventory(
      purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns
    );
  }, [purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns]);

  const isLoaded = !!(allMasters && allPurchases && allSales); 

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

  const dispatch: AppDispatch = useMemo(() => ({
    addPurchase: async (payload) => { 
      await db.purchases.add(payload); 
    },
    updatePurchase: async (payload) => { 
      await db.purchases.put(payload); 
    },
    deletePurchase: async (id) => { 
      await db.purchases.delete(id); 
    },
    
    addSale: async (payload) => { await db.sales.add(payload); },
    updateSale: async (payload) => { await db.sales.put(payload); },
    deleteSale: async (id) => { await db.sales.delete(id); },

    addPayment: async (payload) => { await db.payments.add(payload); },
    updatePayment: async (payload) => { await db.payments.put(payload); },
    deletePayment: async (id) => { await db.payments.delete(id); },

    addReceipt: async (payload) => { await db.receipts.add(payload); },
    updateReceipt: async (payload) => { await db.receipts.put(payload); },
    deleteReceipt: async (id) => { await db.receipts.delete(id); },

    addTransfer: async (payload) => { await db.locationTransfers.add(payload); },
    addAdjustment: async (payload) => { await db.adjustments.add(payload); },
    
    addReturn: async (payload) => {
      if ('originalPurchaseId' in payload) {
        await db.purchaseReturns.add(payload);
      } else {
        await db.saleReturns.add(payload as SaleReturn);
      }
    },
    
    addOrUpdateMaster: async (payload) => { 
      await db.masters.put(payload);
    },

    loadEvents: () => {}, 
    setHasUnsavedChanges: () => {},
    setPurchases: () => {}, 
    setSales: () => {},
    setPurchaseReturns: () => {},
    setSaleReturns: () => {},
  }), []);
  
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
