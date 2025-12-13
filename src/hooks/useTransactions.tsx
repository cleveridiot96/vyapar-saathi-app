
"use client";

import React, { useState, useContext, createContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { Purchase, PurchaseReturn, Sale, SaleReturn, LocationTransfer, LedgerEntry, Payment, Receipt, MasterItem, MasterItemType, StockAdjustment, Customer, Supplier, Agent, Transporter, Warehouse, Broker, Expense } from '@/lib/types';
import { useLocalStorageState } from './useLocalStorageState';
import { purchaseMigrator, salesMigrator } from '@/lib/dataMigrators';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';

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
  
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  transporters: Transporter[];
  setTransporters: React.Dispatch<React.SetStateAction<Transporter[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  brokers: Broker[];
  setBrokers: React.Dispatch<React.SetStateAction<Broker[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;

  addLedgerEntry: (entries: LedgerEntry | LedgerEntry[]) => void;
  removeLedgerEntries: (relatedVoucherId: string) => void;
  addOrUpdateMaster: (item: MasterItem) => void;
  isTransactionsLoaded: boolean;
  isMasterDataLoaded: boolean;
  getAllMasters: () => MasterItem[];
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  // WORKAROUND: Use standard useState with mock data to bypass CSP issues in Firebase Studio.
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>([]);
  const [locationTransfers, setLocationTransfers] = useState<LocationTransfer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  
  // Inject mock data for dropdown testing
  const [customers, setCustomers] = useState<Customer[]>([
    { id: "C-201", name: "Kiran & Sons", type: "Customer" },
    { id: "C-202", name: "Zenith Corp", type: "Customer" }
  ]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "S-101", name: "Ramesh Traders", type: "Supplier" },
    { id: "S-102", name: "Priya Enterprises", type: "Supplier" }
  ]);
  const [agents, setAgents] = useState<Agent[]>([
     { id: 'agent1', type: 'Agent', name: 'Shyam Sundar', details: { commission: 2 } },
  ]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([...FIXED_WAREHOUSES] as Warehouse[]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([...FIXED_EXPENSES] as Expense[]);

  // WORKAROUND: Force loading states to true on mount.
  const [isTransactionsLoaded, setIsTransactionsLoaded] = useState(false);
  const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);
  
  useEffect(() => {
    // This simulates a successful, fast data load, bypassing the localStorage read failure.
    setIsMasterDataLoaded(true);
    setIsTransactionsLoaded(true);
  }, []);

  const addOrUpdateMaster = useCallback((item: MasterItem) => {
    const setterMap: Record<MasterItemType, React.Dispatch<React.SetStateAction<any[]>>> = {
      Customer: setCustomers,
      Supplier: setSuppliers,
      Agent: setAgents,
      Transporter: setTransporters,
      Warehouse: setWarehouses,
      Broker: setBrokers,
      Expense: setExpenses,
      Product: () => {}, // No state for Product type
    };
      
    const setter = setterMap[item.type];
    if (setter) {
        setter((prev) => {
            const existingIndex = prev.findIndex(i => i.id === item.id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = item;
                return updated.sort((a,b) => a.name.localeCompare(b.name));
            } else {
                return [...prev, item].sort((a,b) => a.name.localeCompare(b.name));
            }
        });
    }
  }, []);


  const addLedgerEntry = (entries: LedgerEntry | LedgerEntry[]) => {
    const entriesToAdd = Array.isArray(entries) ? entries : [entries];
    setLedger(prev => [...prev, ...entriesToAdd]);
  };

  const removeLedgerEntries = (relatedVoucherId: string) => {
    setLedger(prev => prev.filter(entry => entry.relatedVoucher !== relatedVoucherId));
  };
  
  const getAllMasters = useMemo(() => () => {
    return [
      ...customers,
      ...suppliers,
      ...agents,
      ...transporters,
      ...warehouses,
      ...brokers,
      ...expenses,
    ];
  }, [customers, suppliers, agents, transporters, warehouses, brokers, expenses]);

  const contextValue = useMemo(() => ({
    purchases, setPurchases,
    purchaseReturns, setPurchaseReturns,
    sales, setSales,
    saleReturns, setSaleReturns,
    locationTransfers, setLocationTransfers,
    payments, setPayments,
    receipts, setReceipts,
    ledger, setLedger,
    adjustments, setAdjustments,
    customers, setCustomers,
    suppliers, setSuppliers,
    agents, setAgents,
    transporters, setTransporters,
    warehouses, setWarehouses,
    brokers, setBrokers,
    expenses, setExpenses,
    addLedgerEntry, removeLedgerEntries,
    addOrUpdateMaster,
    isTransactionsLoaded,
    isMasterDataLoaded,
    getAllMasters,
  }), [
    purchases, sales, purchaseReturns, saleReturns, locationTransfers, payments, receipts, ledger, adjustments,
    customers, suppliers, agents, transporters, warehouses, brokers, expenses,
    isTransactionsLoaded, isMasterDataLoaded, getAllMasters, addOrUpdateMaster
  ]);

  return (
    <TransactionsContext.Provider value={contextValue}>
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
