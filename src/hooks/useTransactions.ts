
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
  
  return {
    ...appState,
    ...dispatch,
    isTransactionsLoaded: appState.isLoaded,
    isMasterDataLoaded: appState.isLoaded,
  };
}
