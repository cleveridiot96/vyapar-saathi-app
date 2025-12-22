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
  const [locationTransfers, setLocationTransfers] = useState<LocationTransfer[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [masterData, setMasterData] = useState({
    Warehouse: [] as MasterItem[],
    Transporter: [] as MasterItem[],
    Expense: [] as MasterItem[],
    Customer: [] as MasterItem[],
    Supplier: [] as MasterItem[],
    Agent: [] as MasterItem[],
    Broker: [] as MasterItem[],
  });

  useEffect(() => {
    // Initialize with fixed masters
    setMasterData({
      Warehouse: FIXED_WAREHOUSES as any,
      Expense: FIXED_EXPENSES as any,
      Transporter: [],
      Customer: [],
      Supplier: [],
      Agent: [],
      Broker: [],
    });
  }, []);

  const addOrUpdateMaster = useCallback((item: any) => {
    setMasterData(prev => {
      const type = item.type || 'Warehouse';
      const typeKey = type as keyof typeof prev;
      const existing = prev[typeKey] ??  [];
      const filtered = existing.filter(e => e.id !== item.id);
      return {
        ...prev,
        [typeKey]: [...filtered, item],
      };
    });
  }, []);

  const getAllMasters = useCallback(() => {
    return Object.values(masterData).flat();
  }, [masterData]);

  const addLedgerEntry = useCallback((entries: LedgerEntry | LedgerEntry[]) => {
    const entriesToAdd = Array.isArray(entries) ? entries : [entries];
    setLedgerEntries(prev => [...prev, ... entriesToAdd]);
  }, []);

  const removeLedgerEntries = useCallback((voucherId: string) => {
    setLedgerEntries(prev => prev.filter(e => e.relatedVoucher !== voucherId));
  }, []);

  return {
    // Transfers
    locationTransfers,
    setLocationTransfers,
    
    // Ledger
    ledgerEntries,
    addLedgerEntry,
    removeLedgerEntries,
    
    // Masters
    masterData,
    addOrUpdateMaster,
    getAllMasters,
    
    // Purchases, Sales, etc.  (from appState)
    purchases: appState.purchases ??  [],
    sales: appState. sales ?? [],
    adjustments: appState.adjustments ??  [],
    purchaseReturns: appState.purchaseReturns ?? [],
    saleReturns: appState. saleReturns ?? [],
    isLoaded: appState.isInitialized,
    payments: [],
    receipts: [],
    setPayments: () => {},
    setReceipts: () => {},
    isTransactionsLoaded: appState.isInitialized,
    isMasterDataLoaded: appState.isInitialized,
    setSales: () => {},
    setPurchaseReturns: () => {},
    setSaleReturns: () => {},
    setAdjustments: () => {},
    setPurchases: () => {},
    ledger: ledgerEntries,
  };
}
