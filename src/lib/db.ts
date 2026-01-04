
import Dexie, { type EntityTable, type Table } from 'dexie';
import type { 
  Purchase, 
  Sale, 
  StockAdjustment, 
  LocationTransfer,
  PurchaseReturn,
  SaleReturn,
  Payment,
  Receipt,
  LedgerEntry,
  MasterItem
} from '@/lib/types';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from './constants';

class MyDatabase extends Dexie {
  public masters!: Table<MasterItem, string>;
  public purchases!: Table<Purchase, string>;
  public sales!: Table<Sale, string>;
  public adjustments!: Table<StockAdjustment, string>;
  public locationTransfers!: Table<LocationTransfer, string>;
  public purchaseReturns!: Table<PurchaseReturn, string>;
  public saleReturns!: Table<SaleReturn, string>;
  public payments!: Table<Payment, string>;
  public receipts!: Table<Receipt, string>;
  public ledger!: Table<LedgerEntry, string>;

  constructor() {
    super('vyapar-saathi-db');
    this.version(6).stores({
      masters: 'id, type, name',
      purchases: 'id, date, supplierId, agentId',
      sales: 'id, date, customerId, brokerId',
      adjustments: 'id, date',
      locationTransfers: 'id, date, fromLocationId, toLocationId',
      purchaseReturns: 'id, date, originalPurchaseId, originalSupplierId',
      saleReturns: 'id, date, originalSaleId, originalCustomerId',
      payments: 'id, date, partyId',
      receipts: 'id, date, partyId',
      ledger: 'id, date, partyId, relatedVoucher',
    });

    this.on('populate', this.populate);
  }
  
  populate = async () => {
    try {
        console.log("Database is being created. Populating with initial master data...");
        const fixedMasters = [...FIXED_WAREHOUSES, ...FIXED_EXPENSES];
        await this.masters.bulkAdd(fixedMasters as MasterItem[]);
        console.log("Initial master data populated successfully.");
    } catch(err) {
        console.error("Failed to populate initial master data", err);
    }
  }
}

export const db = new MyDatabase();
