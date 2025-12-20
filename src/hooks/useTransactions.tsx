
"use client";

import React, { useState, useContext, createContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { Purchase, PurchaseReturn, Sale, SaleReturn, LocationTransfer, LedgerEntry, Payment, Receipt, MasterItem, MasterItemType, StockAdjustment, Customer, Supplier, Agent, Transporter, Warehouse, Broker, Expense } from '@/lib/types';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';

// Define a unified structure for all transactions and master data
interface AppData {
  purchases: Purchase[];
  purchaseReturns: PurchaseReturn[];
  sales: Sale[];
  saleReturns: SaleReturn[];
  locationTransfers: LocationTransfer[];
  payments: Payment[];
  receipts: Receipt[];
  ledger: LedgerEntry[];
  adjustments: StockAdjustment[];
  customers: Customer[];
  suppliers: Supplier[];
  agents: Agent[];
  transporters: Transporter[];
  warehouses: Warehouse[];
  brokers: Broker[];
  expenses: Expense[];
}

// Define the shape of the context, including setters
interface TransactionsContextType extends AppData {
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  setPurchaseReturns: React.Dispatch<React.SetStateAction<PurchaseReturn[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setSaleReturns: React.Dispatch<React.SetStateAction<SaleReturn[]>>;
  setLocationTransfers: React.Dispatch<React.SetStateAction<LocationTransfer[]>>;
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  setAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setTransporters: React.Dispatch<React.SetStateAction<Transporter[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setBrokers: React.Dispatch<React.SetStateAction<Broker[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  
  addLedgerEntry: (entries: LedgerEntry | LedgerEntry[]) => void;
  removeLedgerEntries: (relatedVoucherId: string) => void;
  addOrUpdateMaster: (item: MasterItem) => void;
  isTransactionsLoaded: boolean;
  isMasterDataLoaded: boolean;
  getAllMasters: () => MasterItem[];
  masterData: {
      Customer: Customer[];
      Supplier: Supplier[];
      Agent: Agent[];
      Transporter: Transporter[];
      Warehouse: Warehouse[];
      Broker: Broker[];
      Expense: Expense[];
  }
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

const APP_DATA_STORAGE_KEY = 'vyapar-saathi-app-data';

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [appData, setAppData] = useState<AppData>({
    purchases: [],
    purchaseReturns: [],
    sales: [],
    saleReturns: [],
    locationTransfers: [],
    payments: [],
    receipts: [],
    ledger: [],
    adjustments: [],
    customers: [],
    suppliers: [],
    agents: [],
    transporters: [],
    warehouses: [...FIXED_WAREHOUSES] as Warehouse[],
    brokers: [],
    expenses: [...FIXED_EXPENSES] as Expense[],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Ensure fixed warehouses/expenses are always present
        parsedData.warehouses = [...(parsedData.warehouses || []).filter((w: Warehouse) => !FIXED_WAREHOUSES.some(fw => fw.id === w.id)), ...FIXED_WAREHOUSES];
        parsedData.expenses = [...(parsedData.expenses || []).filter((e: Expense) => !FIXED_EXPENSES.some(fe => fe.id === e.id)), ...FIXED_EXPENSES];
        setAppData(prev => ({ ...prev, ...parsedData }));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      try {
        const dataToStore = JSON.stringify(appData);
        localStorage.setItem(APP_DATA_STORAGE_KEY, dataToStore);
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [appData, isLoaded]);

  // Create individual setters for convenience, using functional updates
  const createSetter = <K extends keyof AppData>(key: K) => 
    (value: React.SetStateAction<AppData[K]>) => 
      setAppData(prev => ({
        ...prev,
        [key]: typeof value === 'function' ? (value as (prevState: AppData[K]) => AppData[K])(prev[key]) : value,
      }));

  const setPurchases = createSetter('purchases');
  const setPurchaseReturns = createSetter('purchaseReturns');
  const setSales = createSetter('sales');
  const setSaleReturns = createSetter('saleReturns');
  const setLocationTransfers = createSetter('locationTransfers');
  const setPayments = createSetter('payments');
  const setReceipts = createSetter('receipts');
  const setLedger = createSetter('ledger');
  const setAdjustments = createSetter('adjustments');
  const setCustomers = createSetter('customers');
  const setSuppliers = createSetter('suppliers');
  const setAgents = createSetter('agents');
  const setTransporters = createSetter('transporters');
  const setWarehouses = createSetter('warehouses');
  const setBrokers = createSetter('brokers');
  const setExpenses = createSetter('expenses');
  
  const addOrUpdateMaster = useCallback((item: MasterItem) => {
    const setterMap: Record<MasterItemType, React.Dispatch<React.SetStateAction<any[]>>> = {
      Customer: setCustomers,
      Supplier: setSuppliers,
      Agent: setAgents,
      Transporter: setTransporters,
      Warehouse: setWarehouses,
      Broker: setBrokers,
      Expense: setExpenses,
      Product: () => {},
    };
      
    const setter = setterMap[item.type];
    if (setter) {
        setter(prev => {
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
  }, [setCustomers, setSuppliers, setAgents, setTransporters, setWarehouses, setBrokers, setExpenses]);

  const addLedgerEntry = useCallback((entries: LedgerEntry | LedgerEntry[]) => {
    setLedger(prev => [...prev, ...(Array.isArray(entries) ? entries : [entries])]);
  }, [setLedger]);

  const removeLedgerEntries = useCallback((relatedVoucherId: string) => {
    setLedger(prev => prev.filter(entry => entry.relatedVoucher !== relatedVoucherId));
  }, [setLedger]);
  
  const getAllMasters = useCallback(() => [
      ...appData.customers, ...appData.suppliers, ...appData.agents,
      ...appData.transporters, ...appData.warehouses, ...appData.brokers,
      ...appData.expenses,
  ], [appData]);

  const masterData = useMemo(() => ({
    Customer: appData.customers, Supplier: appData.suppliers, Agent: appData.agents,
    Transporter: appData.transporters, Warehouse: appData.warehouses, Broker: appData.brokers,
    Expense: appData.expenses,
  }), [appData]);

  const contextValue = useMemo(() => ({
    ...appData,
    setPurchases, setPurchaseReturns, setSales, setSaleReturns, setLocationTransfers,
    setPayments, setReceipts, setLedger, setAdjustments,
    setCustomers, setSuppliers, setAgents, setTransporters, setWarehouses, setBrokers, setExpenses,
    addLedgerEntry, removeLedgerEntries, addOrUpdateMaster,
    isTransactionsLoaded: isLoaded,
    isMasterDataLoaded: isLoaded,
    getAllMasters,
    masterData,
  }), [appData, isLoaded, addOrUpdateMaster, addLedgerEntry, removeLedgerEntries, getAllMasters, masterData]);

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
