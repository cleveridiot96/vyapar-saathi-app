
import Dexie, { type Table, type Middleware } from 'dexie';
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
import { encryptData, decryptData } from './encryption';

let sessionKey: CryptoKey | null = null;

export function setSessionKey(key: CryptoKey) {
  sessionKey = key;
}

export function clearSessionKey() {
  sessionKey = null;
}

export const encryptionMiddleware: Middleware = {
    stack: "dbcore",
    name: "Encryption",
    create: (downlevelDatabase) => ({
      ...downlevelDatabase,
      table: (tableName) => {
        const downlevelTable = downlevelDatabase.table(tableName);
        return {
          ...downlevelTable,
          mutate: async (req) => {
            if (!sessionKey) return downlevelTable.mutate(req);
            
            // This middleware only encrypts user data, not config tables like 'keyval'
            if (tableName === 'keyval') return downlevelTable.mutate(req);

            try {
              const encryptedValues = await Promise.all(
                req.values.map(async (value) => {
                  const encrypted = await encryptData(sessionKey!, value);
                  // We store the encrypted data in a wrapper object.
                  // The original primary key is preserved.
                  return {
                    [downlevelTable.schema.primKey.keyPath as string]: value[downlevelTable.schema.primKey.keyPath as string],
                    _encryptedData: encrypted,
                  };
                })
              );
              req.values = encryptedValues;
            } catch (e) {
              console.error('Encryption failed', e);
              // Fail open on encryption error? Or throw? For now, we throw.
              throw new Error("Encryption failed during write operation.");
            }
            return downlevelTable.mutate(req);
          },
          get: async (req) => {
            if (!sessionKey) return downlevelTable.get(req);
            if (tableName === 'keyval') return downlevelTable.get(req);

            const result = await downlevelTable.get(req);
            if (result && result._encryptedData) {
              try {
                return await decryptData(sessionKey, result._encryptedData);
              } catch (e) {
                console.error("Decryption failed on get:", e);
                // Clear the key so the user is forced to log in again
                clearSessionKey();
                window.location.reload(); // Force a reload to show login screen
                throw e; // re-throw to prevent returning corrupted data
              }
            }
            return result;
          },
          query: async (req) => {
            if (!sessionKey) return downlevelTable.query(req);
            if (tableName === 'keyval') return downlevelTable.query(req);

            const result = await downlevelTable.query(req);
            try {
              const decryptedValues = await Promise.all(
                result.result.map(async (item) => {
                  if (item && item._encryptedData) {
                    return await decryptData(sessionKey!, item._encryptedData);
                  }
                  return item;
                })
              );
              return { ...result, result: decryptedValues };
            } catch(e) {
               console.error("Decryption failed on query:", e);
                clearSessionKey();
                window.location.reload();
                throw e;
            }
          },
        };
      },
    }),
};

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
  public keyval!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('vyapar-saathi-db');
    this.version(3).stores({
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
      keyval: 'key', // Simple key-value store for app settings like salt
    });
    
    // Apply middleware
    this.use(encryptionMiddleware);
  }

  async on(event: 'ready', subscriber: () => any): Promise<void> {
    const subscribed = super.on(event, subscriber);
    
    this.masters.count().then(count => {
        if (count === 0) {
            console.log("Database is empty. Populating with initial data...");
            // Do NOT encrypt the initial fixed masters. This happens before a key exists.
            // The middleware will skip encryption if sessionKey is null.
            this.masters.bulkAdd([...FIXED_WAREHOUSES, ...FIXED_EXPENSES]).catch(err => {
                console.error("Failed to populate initial master data", err);
            });
        }
    });

    return subscribed;
  }
}

export const db = new MyDatabase();
