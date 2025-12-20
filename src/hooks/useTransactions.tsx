
"use client";

import React, { useState, useContext, createContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { Purchase, PurchaseReturn, Sale, SaleReturn, LocationTransfer, LedgerEntry, Payment, Receipt, MasterItem, MasterItemType, StockAdjustment, Customer, Supplier, Agent, Transporter, Warehouse, Broker, Expense } from '@/lib/types';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';
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

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases, pLoading] = useLocalStorageState<Purchase[]>('transactions_purchases', []);
  const [purchaseReturns, setPurchaseReturns, prLoading] = useLocalStorageState<PurchaseReturn[]>('transactions_purchaseReturns', []);
  const [sales, setSales, sLoading] = useLocalStorageState<Sale[]>('transactions_sales', []);
  const [saleReturns, setSaleReturns, srLoading] = useLocalStorageState<SaleReturn[]>('transactions_saleReturns', []);
  const [locationTransfers, setLocationTransfers, ltLoading] = useLocalStorageState<LocationTransfer[]>('transactions_locationTransfers', []);
  const [payments, setPayments, payLoading] = useLocalStorageState<Payment[]>('transactions_payments', []);
  const [receipts, setReceipts, recLoading] = useLocalStorageState<Receipt[]>('transactions_receipts', []);
  const [ledger, setLedger, ldgLoading] = useLocalStorageState<LedgerEntry[]>('transactions_ledger', []);
  const [adjustments, setAdjustments, adjLoading] = useLocalStorageState<StockAdjustment[]>('transactions_adjustments', []);
  
  const [customers, setCustomers, cLoading] = useLocalStorageState<Customer[]>('masters_customers', []);
  const [suppliers, setSuppliers, supLoading] = useLocalStorageState<Supplier[]>('masters_suppliers', []);
  const [agents, setAgents, aLoading] = useLocalStorageState<Agent[]>('masters_agents', []);
  const [transporters, setTransporters, tLoading] = useLocalStorageState<Transporter[]>('masters_transporters', []);
  const [warehouses, setWarehouses, wLoading] = useLocalStorageState<Warehouse[]>('masters_warehouses', [...FIXED_WAREHOUSES] as Warehouse[]);
  const [brokers, setBrokers, bLoading] = useLocalStorageState<Broker[]>('masters_brokers', []);
  const [expenses, setExpenses, eLoading] = useLocalStorageState<Expense[]>('masters_expenses', [...FIXED_EXPENSES] as Expense[]);

  const isTransactionsLoaded = !pLoading && !prLoading && !sLoading && !srLoading && !ltLoading && !payLoading && !recLoading && !ldgLoading && !adjLoading;
  const isMasterDataLoaded = !cLoading && !supLoading && !aLoading && !tLoading && !wLoading && !bLoading && !eLoading;

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
  }, [setCustomers, setSuppliers, setAgents, setTransporters, setWarehouses, setBrokers, setExpenses]);


  const addLedgerEntry = useCallback((entries: LedgerEntry | LedgerEntry[]) => {
    const entriesToAdd = Array.isArray(entries) ? entries : [entries];
    setLedger(prev => [...prev, ...entriesToAdd]);
  }, [setLedger]);

  const removeLedgerEntries = useCallback((relatedVoucherId: string) => {
    setLedger(prev => prev.filter(entry => entry.relatedVoucher !== relatedVoucherId));
  }, [setLedger]);
  
  const getAllMasters = useCallback(() => {
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

  const masterData = useMemo(() => ({
    Customer: customers,
    Supplier: suppliers,
    Agent: agents,
    Transporter: transporters,
    Warehouse: warehouses,
    Broker: brokers,
    Expense: expenses,
  }), [customers, suppliers, agents, transporters, warehouses, brokers, expenses]);


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
    masterData,
  }), [
    purchases, sales, purchaseReturns, saleReturns, locationTransfers, payments, receipts, ledger, adjustments,
    customers, suppliers, agents, transporters, warehouses, brokers, expenses,
    isTransactionsLoaded, isMasterDataLoaded,
    setPurchases, setPurchaseReturns, setSales, setSaleReturns, setLocationTransfers, setPayments, setReceipts, setLedger, setAdjustments,
    setCustomers, setSuppliers, setAgents, setTransporters, setWarehouses, setBrokers, setExpenses,
    addLedgerEntry, removeLedgerEntries, addOrUpdateMaster, getAllMasters, masterData
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
