"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { 
    Purchase, Sale, Payment, Receipt, LocationTransfer, PurchaseReturn, SaleReturn, 
    MasterItem, LedgerEntry, StockAdjustment 
} from '@/lib/types';
import { MasterItemType } from '../lib/types';


// We use useLiveQuery because it is efficient, handles the Database directly, 
// and does NOT cause the infinite loops or update depth errors.
export const useTransactions = () => {
    // Purchases
    const purchases = useLiveQuery(() => db.purchases.toArray(), [], []);

    // Sales
    const sales = useLiveQuery(() => db.sales.toArray(), [], []);

    // Payments & Receipts
    const payments = useLiveQuery(() => db.payments.toArray(), [], []);
    
    const receipts = useLiveQuery(() => db.receipts.toArray(), [], []);

    // Transfers & Adjustments & Returns
    const locationTransfers = useLiveQuery(() => db.locationTransfers.toArray(), [], []);
    
    const adjustments = useLiveQuery(() => db.adjustments.toArray(), [], []);
    
    const purchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), [], []);
    
    const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), [], []);
    
    // Ledger
    const ledger = useLiveQuery(() => db.ledger.toArray(), [], []);


    // Master Data
    const customers = useLiveQuery(() => db.masters.where('type').equals('Customer').toArray(), [], []);
    
    const suppliers = useLiveQuery(() => db.masters.where('type').equals('Supplier').toArray(), [], []);

    const agents = useLiveQuery(() => db.masters.where('type').equals('Agent').toArray(), [], []);

    const transporters = useLiveQuery(() => db.masters.where('type').equals('Transporter').toArray(), [], []);
    
    const warehouses = useLiveQuery(() => db.masters.where('type').equals('Warehouse').toArray(), [], []);

    const brokers = useLiveQuery(() => db.masters.where('type').equals('Broker').toArray(), [], []);

    const expenses = useLiveQuery(() => db.masters.where('type').equals('Expense').toArray(), [], []);

    const isTransactionsLoaded = purchases !== undefined && sales !== undefined && payments !== undefined && receipts !== undefined;

    const addLedgerEntry = (newEntries: any) => {
        db.ledger.bulkAdd(Array.isArray(newEntries) ? newEntries : [newEntries]);
    };
    
    const removeLedgerEntries = (relatedVoucherId: string) => {
        db.ledger.where({ relatedVoucher: relatedVoucherId }).delete();
    };
    
    const addOrUpdateMaster = (item: MasterItem) => {
        return db.masters.put(item);
    }
    
    const getAllMasters = () => {
        return [
            ...(customers || []),
            ...(suppliers || []),
            ...(agents || []),
            ...(brokers || []),
            ...(transporters || []),
            ...(warehouses || []),
            ...(expenses || [])
        ];
    };


    // Return consistent interface
    return {
        purchases: purchases || [],
        setPurchases: (val: Purchase[]) => db.purchases.bulkPut(val),
        sales: sales || [],
        setSales: (val: Sale[]) => db.sales.bulkPut(val),
        payments: payments || [],
        setPayments: (val: Payment[]) => db.payments.bulkPut(val),
        receipts: receipts || [],
        setReceipts: (val: Receipt[]) => db.receipts.bulkPut(val),
        locationTransfers: locationTransfers || [],
        setLocationTransfers: (val: LocationTransfer[]) => db.locationTransfers.bulkPut(val),
        purchaseReturns: purchaseReturns || [],
        setPurchaseReturns: (val: PurchaseReturn[]) => db.purchaseReturns.bulkPut(val),
        saleReturns: saleReturns || [],
        setSaleReturns: (val: SaleReturn[]) => db.saleReturns.bulkPut(val),
        ledger: ledger || [],
        setLedger: (val: LedgerEntry[]) => db.ledger.bulkPut(val),
        addLedgerEntry, 
        removeLedgerEntries,
        adjustments: adjustments || [],
        setAdjustments: (val: StockAdjustment[]) => db.adjustments.bulkPut(val),
        customers: customers || [], 
        setCustomers: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Customer')),
        suppliers: suppliers || [], 
        setSuppliers: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Supplier')),
        agents: agents || [], 
        setAgents: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Agent')),
        transporters: transporters || [], 
        setTransporters: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Transporter')),
        warehouses: warehouses || [], 
        setWarehouses: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Warehouse')),
        brokers: brokers || [],
        setBrokers: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Broker')),
        expenses: expenses || [],
        setExpenses: (val: MasterItem[]) => db.masters.bulkPut(val.filter(v => v.type === 'Expense')),
        getAllMasters,
        addOrUpdateMaster,
        isTransactionsLoaded, 
    };
};
