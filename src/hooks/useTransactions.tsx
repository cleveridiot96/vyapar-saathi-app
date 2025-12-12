"use client";

import React, { useState, useContext, createContext, ReactNode, useEffect } from 'react';
import type { Purchase, PurchaseReturn, Sale, SaleReturn, LocationTransfer, LedgerEntry, Payment, Receipt, MasterItem, MasterItemType } from '@/lib/types';
import { useLocalStorageState } from './useLocalStorageState';

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
  addLedgerEntry: (entries: LedgerEntry | LedgerEntry[]) => void;
  removeLedgerEntries: (relatedVoucherId: string) => void;
  isTransactionsLoaded: boolean;
  isMasterDataLoaded: boolean;
  masterData: Record<MasterItemType, MasterItem[]>;
  addOrUpdateMaster: (item: MasterItem) => void;
  getAllMasters: () => MasterItem[];
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

const initialMasterData: Record<MasterItemType, MasterItem[]> = {
    Supplier: [{ id: 'sup1', type: 'Supplier', name: 'Krishna Traders' },{ id: 'sup2', type: 'Supplier', name: 'Radha Trading Co' },],
    Customer: [{ id: 'cus1', type: 'Customer', name: 'Gopal Dairy' },],
    Agent: [{ id: 'agent1', type: 'Agent', name: 'Shyam Sundar', details: { commission: 2 } },],
    Broker: [],
    Warehouse: [{ id: 'wh1', type: 'Warehouse', name: 'Main Godown' },],
    Transporter: [{ id: 'trans1', type: 'Transporter', name: 'Ganesh Roadways' },],
    Expense: [{ id: 'exp1', type: 'Expense', name: 'Freight' },{ id: 'exp2', type: 'Expense', name: 'Labour' },{ id: 'exp3', type: 'Expense', name: 'Commission' },],
    Product: [{ id: 'prod1', type: 'Product', name: 'Arecanut' },]
};


export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useLocalStorageState<Purchase[]>('purchasesData', []);
  const [purchaseReturns, setPurchaseReturns] = useLocalStorageState<PurchaseReturn[]>('purchaseReturnsData', []);
  const [sales, setSales] = useLocalStorageState<Sale[]>('salesData', []);
  const [saleReturns, setSaleReturns] = useLocalStorageState<SaleReturn[]>('saleReturnsData', []);
  const [locationTransfers, setLocationTransfers] = useLocalStorageState<LocationTransfer[]>('locationTransfersData', []);
  const [payments, setPayments] = useLocalStorageState<Payment[]>('paymentsData', []);
  const [receipts, setReceipts] = useLocalStorageState<Receipt[]>('receiptsData', []);
  const [ledger, setLedger] = useLocalStorageState<LedgerEntry[]>('ledgerData', []);
  const [masterData, setMasterData] = useLocalStorageState<Record<MasterItemType, MasterItem[]>>('masterData', initialMasterData);

  const [isTransactionsLoaded, setIsTransactionsLoaded] = useState(false);
  const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);

  useEffect(() => {
    // This effect can be expanded if data is fetched asynchronously
    setIsTransactionsLoaded(true);
    setIsMasterDataLoaded(true);
  }, []);

  const addLedgerEntry = (entries: LedgerEntry | LedgerEntry[]) => {
    const entriesToAdd = Array.isArray(entries) ? entries : [entries];
    setLedger(prev => [...prev, ...entriesToAdd]);
  };

  const removeLedgerEntries = (relatedVoucherId: string) => {
    setLedger(prev => prev.filter(entry => entry.relatedVoucher !== relatedVoucherId));
  };
  
  const addOrUpdateMaster = (item: MasterItem) => {
    setMasterData(prevData => {
      const existingItems = prevData[item.type] || [];
      const itemIndex = existingItems.findIndex(i => i.id === item.id);
      
      let updatedItems;
      if (itemIndex > -1) {
        updatedItems = [...existingItems.slice(0, itemIndex), item, ...existingItems.slice(itemIndex + 1)];
      } else {
        const newItem = { ...item, id: item.id || `${item.type.toLowerCase()}-${Date.now()}` };
        updatedItems = [newItem, ...existingItems];
      }
      return { ...prevData, [item.type]: updatedItems };
    });
  };

  const getAllMasters = () => Object.values(masterData).flat();

  const value = {
    purchases, setPurchases,
    purchaseReturns, setPurchaseReturns,
    sales, setSales,
    saleReturns, setSaleReturns,
    locationTransfers, setLocationTransfers,
    payments, setPayments,
    receipts, setReceipts,
    ledger, setLedger,
    addLedgerEntry, removeLedgerEntries,
    isTransactionsLoaded,
    masterData,
    isMasterDataLoaded,
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
