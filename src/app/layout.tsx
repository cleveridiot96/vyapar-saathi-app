
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppExitHandler from '@/components/layout/AppExitHandler';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppState, AppDispatch } from '@/hooks/useAppState';
import { AppStateContext, AppDispatchContext } from '@/hooks/useAppState';
import { getEvents, onEventsChange, initializeEventStore, addEvent } from '@/lib/eventStore';
import { deriveAllTransactions, DerivedTransactions } from '@/lib/derives';
import type { TransactionEvent } from '@/lib/eventStore';
import type { MasterItem } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [state, setState] = useState<Omit<AppState, 'getAllMasters' | 'isLoaded'>>({
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
      inventory: [],
      isInitialized: false,
      isCalculating: true,
      masterData: { Customer: [], Supplier: [], Agent: [], Transporter: [], Warehouse: [], Broker: [], Expense: [], Product: [] },
  });

  const [inventoryWorker, setInventoryWorker] = useState<Worker | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // const isAuthenticated = sessionStorage.getItem('vyapar-saathi-authenticated') === 'true';
    // const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/setup') || pathname.startsWith('/recover');

    // if (!isAuthenticated && !isAuthPage) {
    //   router.replace('/login');
    // }
  }, [pathname, router]);

  useEffect(() => {
    const worker = new Worker(new URL('../lib/inventory.worker.ts', import.meta.url));
    setInventoryWorker(worker);

    worker.onmessage = (e) => {
      const inventory = e.data;
      setState(prevState => ({
        ...prevState,
        inventory,
        isCalculating: false,
      }));
    };

    const init = async () => {
      await initializeEventStore();
      const initialEvents = getEvents();
      const derived = deriveAllTransactions(initialEvents);

      setState(prevState => ({
        ...prevState,
        ...derived,
        events: initialEvents,
        isInitialized: true,
        isCalculating: true,
      }));
      
      worker.postMessage(initialEvents);
    };

    init();

    const unsubscribe = onEventsChange((newEvents) => {
      const derived = deriveAllTransactions(newEvents);
       setState(prevState => ({
        ...prevState,
        ...derived,
        events: newEvents,
        isCalculating: true,
      }));
      worker.postMessage(newEvents);
    });

    return () => {
      unsubscribe();
      worker.terminate();
    };
  }, []);

  const getAllMasters = useCallback((): MasterItem[] => {
    if (!state.masterData) return [];
    return Object.values(state.masterData).flat();
  }, [state.masterData]);

  const dispatch: AppDispatch = useMemo(() => ({
      addOrUpdateMaster: (master) => addEvent({ type: 'MASTER_UPSERTED', payload: master }),
      addPurchase: (purchase) => addEvent({ type: 'PURCHASE_CREATED', payload: purchase }),
      updatePurchase: (purchase) => addEvent({ type: 'PURCHASE_UPDATED', payload: purchase }),
      deletePurchase: (id) => addEvent({ type: 'PURCHASE_DELETED', payload: { id } }),
      addSale: (sale) => addEvent({ type: 'SALE_CREATED', payload: sale }),
      updateSale: (sale) => addEvent({ type: 'SALE_UPDATED', payload: sale }),
      deleteSale: (id) => addEvent({ type: 'SALE_DELETED', payload: { id } }),
      addPayment: (payment) => addEvent({ type: 'PAYMENT_CREATED', payload: payment }),
      updatePayment: (payment) => addEvent({ type: 'PAYMENT_UPDATED', payload: payment }),
      deletePayment: (id) => addEvent({ type: 'PAYMENT_DELETED', payload: { id } }),
      addReceipt: (receipt) => addEvent({ type: 'RECEIPT_CREATED', payload: receipt }),
      updateReceipt: (receipt) => addEvent({ type: 'RECEIPT_UPDATED', payload: receipt }),
      deleteReceipt: (id) => addEvent({ type: 'RECEIPT_DELETED', payload: { id } }),
      addTransfer: (transfer) => addEvent({ type: 'TRANSFER_CREATED', payload: transfer }),
      addAdjustment: (adj) => addEvent({ type: 'ADJUSTMENT_CREATED', payload: adj }),
      addReturn: (ret) => addEvent({ type: 'RETURN_CREATED', payload: ret }),
      setPurchases: (purchases) => purchases.forEach(p => addEvent({ type: 'PURCHASE_CREATED', payload: p})),
      setSales: (sales) => sales.forEach(s => addEvent({ type: 'SALE_CREATED', payload: s})),
      setPurchaseReturns: (returns) => returns.forEach(r => addEvent({type: 'RETURN_CREATED', payload: r})),
      setSaleReturns: (returns) => returns.forEach(r => addEvent({type: 'RETURN_CREATED', payload: r})),
      setPayments: (payments) => payments.forEach(p => addEvent({type: 'PAYMENT_CREATED', payload: p})),
      setReceipts: (receipts) => receipts.forEach(r => addEvent({type: 'RECEIPT_CREATED', payload: r})),
      setLocationTransfers: (transfers) => transfers.forEach(t => addEvent({type: 'TRANSFER_CREATED', payload: t})),
      setAdjustments: (adjustments) => adjustments.forEach(a => addEvent({type: 'ADJUSTMENT_CREATED', payload: a})),
  }), []);


  const contextValue = useMemo(() => ({
    ...state,
    isLoaded: state.isInitialized && !state.isCalculating,
    getAllMasters,
  }), [state, getAllMasters]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <SettingsProvider>
          <AppStateContext.Provider value={contextValue as AppState}>
            <AppDispatchContext.Provider value={dispatch}>
              {children}
              <Toaster />
              <AppExitHandler />
            </AppDispatchContext.Provider>
          </AppStateContext.Provider>
        </SettingsProvider>
      </body>
    </html>
  );
}
