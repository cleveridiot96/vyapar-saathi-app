
"use client";

import { useAppState } from './useAppState';
import type { LocationTransfer, LedgerEntry, MasterItem } from '@/lib/types';
import { useState, useCallback, useEffect } from 'react';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';

/**
 * Complete transaction management hook
 * This provides the data LocationTransferClient needs
 */
export function useTransactions() {
  const appState = useAppState();
  const { 
    masterData: appMasterData, 
    addOrUpdateMaster: appAddOrUpdateMaster,
    ...restOfAppState 
  } = appState;

  const [locationTransfers, setLocationTransfers] = useState<LocationTransfer[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  
  const getAllMasters = useCallback(() => {
    return Object.values(appMasterData).flat();
  }, [appMasterData]);

  const addLedgerEntry = useCallback((entries: LedgerEntry | LedgerEntry[]) => {
    const entriesToAdd = Array.isArray(entries) ? entries : [entries];
    setLedgerEntries(prev => [...prev, ... entriesToAdd]);
  }, []);

  const removeLedgerEntries = useCallback((voucherId: string) => {
    setLedgerEntries(prev => prev.filter(e => e.relatedVoucher !== voucherId));
  }, []);

  return {
    // Transfers
    locationTransfers: restOfAppState.locationTransfers ?? [],
    setLocationTransfers: restOfAppState.setLocationTransfers,
    
    // Ledger
    ledgerEntries,
    addLedgerEntry,
    removeLedgerEntries,
    
    // Masters
    masterData: appMasterData,
    addOrUpdateMaster: appAddOrUpdateMaster,
    getAllMasters,
    
    // Purchases, Sales, etc.  (from appState)
    purchases: restOfAppState.purchases ??  [],
    sales: restOfAppState. sales ?? [],
    adjustments: restOfAppState.adjustments ??  [],
    purchaseReturns: restOfAppState.purchaseReturns ?? [],
    saleReturns: restOfAppState. saleReturns ?? [],
    isLoaded: restOfAppState.isInitialized,
    payments: restOfAppState.payments ?? [],
    receipts: restOfAppState.receipts ?? [],
    setPayments: restOfAppState.setPayments,
    setReceipts: restOfAppState.setReceipts,
    isTransactionsLoaded: restOfAppState.isInitialized,
    isMasterDataLoaded: restOfAppState.isInitialized,
    setSales: restOfAppState.setSales,
    setPurchaseReturns: restOfAppState.setPurchaseReturns,
    setSaleReturns: restOfAppState.setSaleReturns,
    setAdjustments: restOfAppState.setAdjustments,
    setPurchases: restOfAppState.setPurchases,
    ledger: ledgerEntries,
  };
}
