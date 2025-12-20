// CREATE: src/hooks/useZustandSync.ts
// This syncs your existing data from useTransactions to Zustand stores

import { useEffect } from 'react';
import { useTransactions } from './useTransactions';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { useSaleStore } from '@/stores/saleStore';

export function useZustandSync() {
  const { purchases: contextPurchases, sales: contextSales, isTransactionsLoaded } = useTransactions();
  
  const initializePurchases = usePurchaseStore((state) => state.initializePurchases);
  const initializeSales = useSaleStore((state) => state.initializeSales);
  
  const zustandPurchases = usePurchaseStore((state) => state.purchases);
  const zustandSales = useSaleStore((state) => state.sales);

  // ONE-TIME SYNC: Migrate data from context to Zustand on first load
  useEffect(() => {
    if (!isTransactionsLoaded) return;

    // Only sync if Zustand is empty (first time)
    if (zustandPurchases.length === 0 && contextPurchases.length > 0) {
      console.log('🔄 MIGRATING purchases from context to Zustand:', contextPurchases.length);
      initializePurchases(contextPurchases);
    }

    if (zustandSales.length === 0 && contextSales.length > 0) {
      console.log('🔄 MIGRATING sales from context to Zustand:', contextSales.length);
      initializeSales(contextSales);
    }
  }, [isTransactionsLoaded, contextPurchases, contextSales, zustandPurchases.length, zustandSales.length, initializePurchases, initializeSales]);

  return {
    isSynced: zustandPurchases.length > 0 || zustandSales.length > 0 || 
              (contextPurchases.length === 0 && contextSales.length === 0),
  };
}
