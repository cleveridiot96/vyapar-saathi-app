
"use client";

import React, { useState, useContext, createContext, ReactNode, useEffect, useMemo } from 'react';
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
  isTransactionsLoaded: boolean;
  isMasterDataLoaded: boolean;
  getAllMasters: () => MasterItem[];
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  // Transactional Data
  const [purchases, setPurchases] = useLocalStorageState<Purchase[]>('purchasesData', [], purchaseMigrator);
  const [purchaseReturns, setPurchaseReturns] = useLocalStorageState<PurchaseReturn[]>('purchaseReturnsData', []);
  const [sales, setSales] = useLocalStorageState<Sale[]>('salesData', [], salesMigrator);
  const [saleReturns, setSaleReturns] = useLocalStorageState<SaleReturn[]>('saleReturnsData', []);
  const [locationTransfers, setLocationTransfers] = useLocalStorageState<LocationTransfer[]>('locationTransfersData', []);
  const [payments, setPayments] = useLocalStorageState<Payment[]>('paymentsData', []);
  const [receipts, setReceipts] = useLocalStorageState<Receipt[]>('receiptsData', []);
  const [ledger, setLedger] = useLocalStorageState<LedgerEntry[]>('ledgerData', []);
  const [adjustments, setAdjustments] = useLocalStorageState<StockAdjustment[]>('adjustmentsData', []);
  
  // Master Data
  const [customers, setCustomers] = useLocalStorageState<Customer[]>('master_customers', []);
  const [suppliers, setSuppliers] = useLocalStorageState<Supplier[]>('master_suppliers', []);
  const [agents, setAgents] = useLocalStorageState<Agent[]>('master_agents', []);
  const [transporters, setTransporters] = useLocalStorageState<Transporter[]>('master_transporters', []);
  const [warehouses, setWarehouses] = useLocalStorageState<Warehouse[]>('master_warehouses', [...FIXED_WAREHOUSES] as Warehouse[]);
  const [brokers, setBrokers] = useLocalStorageState<Broker[]>('master_brokers', []);
  const [expenses, setExpenses] = useLocalStorageState<Expense[]>('master_expenses', [...FIXED_EXPENSES] as Expense[]);

  const [isTransactionsLoaded, setIsTransactionsLoaded] = useState(false);
  const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);

  useEffect(() => {
    // This effect ensures fixed items are always present in the master data.
    setWarehouses(prev => {
        const map = new Map(prev.map(item => [item.id, item]));
        FIXED_WAREHOUSES.forEach(fixed => map.set(fixed.id, fixed as Warehouse));
        return Array.from(map.values());
    });
    setExpenses(prev => {
        const map = new Map(prev.map(item => [item.id, item]));
        FIXED_EXPENSES.forEach(fixed => map.set(fixed.id, fixed as Expense));
        return Array.from(map.values());
    });
    setIsMasterDataLoaded(true);
    setIsTransactionsLoaded(true);
  }, [setWarehouses, setExpenses]);


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

  const value = useMemo(() => ({
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
    isTransactionsLoaded,
    isMasterDataLoaded,
    getAllMasters,
  }), [
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
    isTransactionsLoaded,
    isMasterDataLoaded,
    getAllMasters,
  ]);

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
