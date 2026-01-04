
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
  MasterItem,
  AuthDataItem
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
  public auth!: Table<AuthDataItem, string>;

  constructor() {
    super('vyapar-saathi-db-v2');
    this.version(1).stores({
      masters: 'id, type, name',
      purchases: 'id, date, supplierId, agentId',
      sales: 'id, date, customerId, brokerId',
      adjustments: 'id, date, lotNumber',
      locationTransfers: 'id, date, fromLocationId, toLocationId',
      purchaseReturns: 'id, date, originalPurchaseId, originalSupplierId',
      saleReturns: 'id, date, originalSaleId, originalCustomerId',
      payments: 'id, date, partyId',
      receipts: 'id, date, partyId',
      ledger: 'id, date, partyId, relatedVoucher',
      auth: 'key',
    });

    this.on('populate', this.populate);
  }
  
  populate = async () => {
    try {
        const fixedMasters = [...FIXED_WAREHOUSES, ...FIXED_EXPENSES];
        await this.masters.bulkPut(fixedMasters as MasterItem[]);
    } catch {
        // Handle error silently
    }
  }
}

export const db = new MyDatabase();
