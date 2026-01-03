"use client";

import { useLocalStorageState } from './useLocalStorageState';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment 
} from '@/lib/types';
import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
    purchases: 'purchasesData',
    sales: 'salesData',
    receipts: 'receiptsData',
    payments: 'paymentsData',
    locationTransfers: 'locationTransfersData',
    purchaseReturns: 'purchaseReturnsData',
    saleReturns: 'saleReturnsData',
    customers: 'masterCustomers',
    suppliers: 'masterSuppliers',
    agents: 'masterAgents',
    transporters: 'masterTransporters',
    warehouses: 'masterWarehouses',
    brokers: 'masterBrokers',
    expenses: 'masterExpenses',
    ledger: 'ledgerData',
    adjustments: 'stockAdjustmentsData',
};

export const useTransactions = () => {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => { setHydrated(true) }, []);

    const [purchases, setPurchases] = useLocalStorageState<Purchase[]>(STORAGE_KEYS.purchases, []);
    const [sales, setSales] = useLocalStorageState<Sale[]>(STORAGE_KEYS.sales, []);
    const [payments, setPayments] = useLocalStorageState<Payment[]>(STORAGE_KEYS.payments, []);
    const [receipts, setReceipts] = useLocalStorageState<Receipt[]>(STORAGE_KEYS.receipts, []);
    const [locationTransfers, setLocationTransfers] = useLocalStorageState<LocationTransfer[]>(STORAGE_KEYS.locationTransfers, []);
    const [purchaseReturns, setPurchaseReturns] = useLocalStorageState<PurchaseReturn[]>(STORAGE_KEYS.purchaseReturns, []);
    const [saleReturns, setSaleReturns] = useLocalStorageState<SaleReturn[]>(STORAGE_KEYS.saleReturns, []);
    const [ledger, setLedger] = useLocalStorageState<LedgerEntry[]>(STORAGE_KEYS.ledger, []);
    const [adjustments, setAdjustments] = useLocalStorageState<StockAdjustment[]>(STORAGE_KEYS.adjustments, []);
    const [customers, setCustomers] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.customers, []);
    const [suppliers, setSuppliers] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.suppliers, []);
    const [agents, setAgents] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.agents, []);
    const [transporters, setTransporters] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.transporters, []);
    const [warehouses, setWarehouses] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.warehouses, []);
    const [brokers, setBrokers] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.brokers, []);
    const [expenses, setExpenses] = useLocalStorageState<MasterItem[]>(STORAGE_KEYS.expenses, []);

    const addLedgerEntry = (newEntries: LedgerEntry | LedgerEntry[]) => {
        setLedger(prev => [...prev, ...(Array.isArray(newEntries) ? newEntries : [newEntries])]);
    };
    
    const removeLedgerEntries = (relatedVoucherId: string) => {
        setLedger(prev => prev.filter(l => l.relatedVoucher !== relatedVoucherId));
    };

    return {
        purchases, setPurchases,
        sales, setSales,
        payments, setPayments,
        receipts, setReceipts,
        locationTransfers, setLocationTransfers,
        purchaseReturns, setPurchaseReturns,
        saleReturns, setSaleReturns,
        ledger, setLedger, addLedgerEntry, removeLedgerEntries,
        adjustments, setAdjustments,
        customers, setCustomers,
        suppliers, setSuppliers,
        agents, setAgents,
        transporters, setTransporters,
        warehouses, setWarehouses,
        brokers, setBrokers,
        expenses, setExpenses,
        isTransactionsLoaded: hydrated,
    };
};
