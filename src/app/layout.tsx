"use client";

import type { Metadata } from 'next';
import { Poppins, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppExitHandler from '@/components/layout/AppExitHandler';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppStateContext, AppDispatchContext } from '@/hooks/useAppState';
import { getEvents, onEventsChange, initializeEventStore, addEvent } from '@/lib/eventStore';
import { deriveAllTransactions } from '@/lib/derives';
import type { TransactionEvent } from '@/lib/eventStore';
import type { 
  Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, 
  Payment, Receipt, LedgerEntry, MasterItem
} from '@/lib/types';


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeEventStore();
      setEvents(getEvents());
      setIsInitialized(true);
    })();

    const unsubscribe = onEventsChange(setEvents);
    return () => unsubscribe();
  }, []);

  const derivedState = useMemo(() => deriveAllTransactions(events), [events]);

  const state = useMemo(() => ({
    ...derivedState,
    events,
    inventory: [], // This will be calculated elsewhere if needed
    isInitialized,
    isCalculating: false, // Simplified for now
    isMasterDataLoaded: isInitialized,
    isTransactionsLoaded: isInitialized,
    getAllMasters: () => Object.values(derivedState.masterData).flat(),
  }), [derivedState, events, isInitialized]);

  const dispatch = useMemo(() => ({
    addPurchase: (payload: Purchase) => addEvent({ type: 'PURCHASE_CREATED', payload }),
    updatePurchase: (payload: Purchase) => addEvent({ type: 'PURCHASE_UPDATED', payload }),
    deletePurchase: (id: string) => addEvent({ type: 'PURCHASE_DELETED', payload: { id } }),
    addSale: (payload: Sale) => addEvent({ type: 'SALE_CREATED', payload }),
    updateSale: (payload: Sale) => addEvent({ type: 'SALE_UPDATED', payload }),
    deleteSale: (id: string) => addEvent({ type: 'SALE_DELETED', payload: { id } }),
    addTransfer: (payload: LocationTransfer) => addEvent({ type: 'TRANSFER_CREATED', payload }),
    addAdjustment: (payload: StockAdjustment) => addEvent({ type: 'ADJUSTMENT_CREATED', payload }),
    addPayment: (payload: Payment) => addEvent({ type: 'PAYMENT_CREATED', payload }),
    updatePayment: (payload: Payment) => addEvent({ type: 'PAYMENT_UPDATED', payload }),
    deletePayment: (id: string) => addEvent({ type: 'PAYMENT_DELETED', payload: { id } }),
    addReceipt: (payload: Receipt) => addEvent({ type: 'RECEIPT_CREATED', payload }),
    updateReceipt: (payload: Receipt) => addEvent({ type: 'RECEIPT_UPDATED', payload }),
    deleteReceipt: (id: string) => addEvent({ type: 'RECEIPT_DELETED', payload: { id } }),
    addReturn: (payload: PurchaseReturn | SaleReturn) => addEvent({ type: 'RETURN_CREATED', payload }),
    addOrUpdateMaster: (payload: MasterItem) => addEvent({ type: 'MASTER_UPSERTED', payload }),
    addLedgerEntry: (payload: LedgerEntry | LedgerEntry[]) => addEvent({ type: 'LEDGER_ENTRY_CREATED', payload: Array.isArray(payload) ? payload : [payload] }),
    removeLedgerEntries: (voucherId: string) => addEvent({ type: 'LEDGER_ENTRY_DELETED', payload: { voucherId } }),
    
    // The state setters below are complex with event sourcing. We'll no-op them for now.
    setPurchases: () => {},
    setSales: () => {},
    setSaleReturns: () => {},
    setPurchaseReturns: () => {},
    setLocationTransfers: () => {},
    setPayments: () => {},
    setReceipts: () => {},
    setAdjustments: () => {},
    setLedger: () => {},
  }), []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", poppins.variable, sourceCodePro.variable)} suppressHydrationWarning>
          <SettingsProvider>
            <AppStateContext.Provider value={state}>
                <AppDispatchContext.Provider value={dispatch}>
                    {children}
                </AppDispatchContext.Provider>
            </AppStateContext.Provider>
            <Toaster />
            <AppExitHandler />
          </SettingsProvider>
      </body>
    </html>
  );
}
