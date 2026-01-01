import Dexie, { type Table } from 'dexie';
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
  public ledger!: Table<LedgerEntry, number>;

  constructor() {
    super('vyapar-saathi-db');
    this.version(2).stores({
      masters: 'id, type, name',
      purchases: 'id, date, supplierId, agentId',
      sales: 'id, date, customerId, brokerId',
      adjustments: 'id, date',
      locationTransfers: 'id, date, fromLocationId, toLocationId',
      purchaseReturns: 'id, date, originalPurchaseId, originalSupplierId',
      saleReturns: 'id, date, originalSaleId, originalCustomerId',
      payments: 'id, date, partyId',
      receipts: 'id, date, partyId',
      ledger: '++id, date, partyId',
    });
  }

  async on(event: 'ready', subscriber: () => any): Promise<void> {
    const subscribed = super.on(event, subscriber);
    
    this.masters.count().then(count => {
        if (count === 0) {
            console.log("Database is empty. Populating with initial data...");
            this.masters.bulkAdd([...FIXED_WAREHOUSES, ...FIXED_EXPENSES]).catch(err => {
                console.error("Failed to populate initial master data", err);
            });
        }
    });

    return subscribed;
  }
}

export const db = new MyDatabase();
