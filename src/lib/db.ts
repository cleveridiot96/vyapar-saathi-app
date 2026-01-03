
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
        const { schema } = downlevelTable;
        const primKey = schema.primKey;

        return {
          ...downlevelTable,
          mutate: async (req) => {
            if (!sessionKey || tableName === 'keyval') return downlevelTable.mutate(req);
            
            if (req.type === 'add' || req.type === 'put') {
                try {
                  const encryptedValues = await Promise.all(
                    req.values.map(async (value) => {
                      const primaryKeyValue = value[primKey.keyPath as string];
                      const encrypted = await encryptData(sessionKey!, value);
                      return {
                        [primKey.keyPath as string]: primaryKeyValue,
                        _encryptedData: encrypted,
                      };
                    })
                  );
                  req.values = encryptedValues;
                } catch (e) {
                  console.error('Encryption failed', e);
                  throw new Error("Encryption failed during write operation.");
                }
            }
            return downlevelTable.mutate(req);
          },
          get: async (req) => {
            if (!sessionKey || tableName === 'keyval') return downlevelTable.get(req);

            const result = await downlevelTable.get(req);
            if (result && result._encryptedData) {
              try {
                return await decryptData(sessionKey, result._encryptedData);
              } catch (e) {
                console.error("Decryption failed on get:", e);
                clearSessionKey();
                window.location.reload(); 
                throw e;
              }
            }
            return result;
          },
          query: async (req) => {
            if (!sessionKey || tableName === 'keyval') return downlevelTable.query(req);

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
      ledger: '++id, date, partyId, relatedVoucher',
      keyval: 'key',
    });

    // This event handler runs only when the database is first created.
    this.on('populate', () => {
        this.populate();
    });
  }
  
  async populate() {
    try {
        console.log("Database is being created. Populating with initial master data...");
        await this.masters.bulkAdd([...FIXED_WAREHOUSES, ...FIXED_EXPENSES]);
        console.log("Initial master data populated successfully.");
    } catch(err) {
        console.error("Failed to populate initial master data", err);
    }
  }
}

export const db = new MyDatabase();
