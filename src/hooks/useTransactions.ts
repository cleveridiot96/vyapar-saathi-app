"use client";

import { useAppState, useAppDispatch } from './useAppState';
import type { LedgerEntry } from '@/lib/types';
import { useCallback, useMemo } from 'react';

/**
 * Simplified hook for transaction management.
 * Relies on the main app state and dispatch contexts.
 */
export function useTransactions() {
  const appState = useAppState();
  const dispatch = useAppDispatch();
  
  const { masterData, ledger, ...restOfAppState } = appState;

  // Memoize ledger entries to prevent unnecessary recalculations
  const ledgerEntries = useMemo(() => ledger || [], [ledger]);

  // These are now just for demonstration; the actual logic is in the root dispatch
  const addLedgerEntry = useCallback((entries: LedgerEntry | LedgerEntry[]) => {
    console.warn("addLedgerEntry is a placeholder. Logic is in root layout.");
  }, []);

  const removeLedgerEntries = useCallback((voucherId: string) => {
    console.warn("removeLedgerEntries is a placeholder. Logic is in root layout.");
  }, []);

  return {
    ...restOfAppState, // includes purchases, sales, etc.
    ...dispatch,      // includes addOrUpdateMaster, addPurchase, etc.
    masterData,
    ledger: ledgerEntries,
    isTransactionsLoaded: appState.isLoaded,
    isMasterDataLoaded: appState.isLoaded,
  };
}
