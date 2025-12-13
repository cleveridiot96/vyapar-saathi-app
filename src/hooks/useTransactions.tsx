"use client";

import React, { useState, useContext, createContext, ReactNode, useEffect } from 'react';
import type { Purchase, PurchaseReturn, Sale, SaleReturn, LocationTransfer, LedgerEntry, Payment, Receipt, MasterItem, MasterItemType, StockAdjustment } from '@/lib/types';
import { useLocalStorageState } from './useLocalStorageState';
import { purchaseMigrator, salesMigrator } from '@/lib/dataMigrators';
import { useMasterData } from '@/contexts/MasterDataContext';

interface TransactionsContextType {
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  purchaseReturns: PurchaseReturn[];
  setPurchaseReturns: React.Dispatch<React.SetStateAction<PurchaseReturn[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  saleReturns: SaleReturn[];
  setSaleReturns: React.Dispatch<React.SetStateAction<SaleReturn[]>>;
  locationTransfers: LocationTransfer[];
  setLocationTransfers: React.Dispatch<React.SetStateAction<LocationTransfer[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  ledger: LedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  adjustments: StockAdjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  addLedgerEntry: (entries: LedgerEntry | LedgerEntry[]) => void;
  removeLedgerEntries: (relatedVoucherId: string) => void;
  isTransactionsLoaded: boolean;
  isMasterDataLoaded: boolean; // Kept for compatibility but might be redundant
  masterData: Record<MasterItemType, MasterItem[]>; // From new context
  addOrUpdateMaster: (item: MasterItem) => void; // From new context
  getAllMasters: () => MasterItem[]; // From new context
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useLocalStorageState<Purchase[]>('purchasesData', [], purchaseMigrator);
  const [purchaseReturns, setPurchaseReturns] = useLocalStorageState<PurchaseReturn[]>('purchaseReturnsData', []);
  const [sales, setSales] = useLocalStorageState<Sale[]>('salesData', [], salesMigrator);
  const [saleReturns, setSaleReturns] = useLocalStorageState<SaleReturn[]>('saleReturnsData', []);
  const [locationTransfers, setLocationTransfers] = useLocalStorageState<LocationTransfer[]>('locationTransfersData', []);
  const [payments, setPayments] = useLocalStorageState<Payment[]>('paymentsData', []);
  const [receipts, setReceipts] = useLocalStorageState<Receipt[]>('receiptsData', []);
  const [ledger, setLedger] = useLocalStorageState<LedgerEntry[]>('ledgerData', []);
  const [adjustments, setAdjustments] = useLocalStorageState<StockAdjustment[]>('adjustmentsData', []);
  const [isTransactionsLoaded, setIsTransactionsLoaded] = useState(false);

  // Integrate the new MasterDataContext
  const { data: masterData, setData: setMasterDataItem, getAllMasters } = useMasterData();

  useEffect(() => {
    setIsTransactionsLoaded(true);
  }, []);

  const addLedgerEntry = (entries: LedgerEntry | LedgerEntry[]) => {
    const entriesToAdd = Array.isArray(entries) ? entries : [entries];
    setLedger(prev => [...prev, ...entriesToAdd]);
  };

  const removeLedgerEntries = (relatedVoucherId: string) => {
    setLedger(prev => prev.filter(entry => entry.relatedVoucher !== relatedVoucherId));
  };
  
  const addOrUpdateMaster = (item: MasterItem) => {
    setMasterDataItem(item.type, prev => {
      const itemIndex = prev.findIndex(i => i.id === item.id);
      if (itemIndex > -1) {
        const newItems = [...prev];
        newItems[itemIndex] = item;
        return newItems;
      } else {
        return [{...item, id: item.id || `${item.type}-${Date.now()}`}, ...prev];
      }
    });
  };

  const value = {
    purchases, setPurchases,
    purchaseReturns, setPurchaseReturns,
    sales, setSales,
    saleReturns, setSaleReturns,
    locationTransfers, setLocationTransfers,
    payments, setPayments,
    receipts, setReceipts,
    ledger, setLedger,
    adjustments, setAdjustments,
    addLedgerEntry, removeLedgerEntries,
    isTransactionsLoaded,
    masterData,
    isMasterDataLoaded: true, // Now always true as it's handled by its own context
    addOrUpdateMaster,
    getAllMasters,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
