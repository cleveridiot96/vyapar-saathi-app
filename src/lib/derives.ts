// ============================================================================
// DERIVE STATE FROM EVENTS (Pure Functions)
// ============================================================================
import type { TransactionEvent } from './eventStore';
import type { Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, Payment, Receipt, LedgerEntry, MasterItem, MasterItemType } from './types';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from './constants';


export function deriveAllTransactions(events: TransactionEvent[]) {
  const masterData: { [key in MasterItemType]: MasterItem[] } = {
    Customer: [], Supplier: [], Agent: [], Broker: [], Transporter: [],
    Warehouse: [...FIXED_WAREHOUSES],
    Expense: [...FIXED_EXPENSES],
    Product: []
  };
  
  let purchases: Purchase[] = [];
  let sales: Sale[] = [];
  let adjustments: StockAdjustment[] = [];
  let locationTransfers: LocationTransfer[] = [];
  let purchaseReturns: PurchaseReturn[] = [];
  let saleReturns: SaleReturn[] = [];
  let payments: Payment[] = [];
  let receipts: Receipt[] = [];
  let ledger: LedgerEntry[] = [];

  events.forEach(event => {
    switch (event.type) {
      // MASTER DATA
      case 'MASTER_UPSERTED': {
        const { type, id } = event.payload;
        if (!masterData[type]) masterData[type] = [];
        const index = masterData[type].findIndex(item => item.id === id);
        if (index > -1) {
          masterData[type][index] = event.payload;
        } else {
          masterData[type].push(event.payload);
        }
        break;
      }

      // PURCHASES
      case 'PURCHASE_CREATED':
        purchases.push(event.payload);
        break;
      case 'PURCHASE_UPDATED':
        purchases = purchases.map(p => p.id === event.payload.id ? event.payload : p);
        break;
      case 'PURCHASE_DELETED':
        purchases = purchases.filter(p => p.id !== event.payload.id);
        break;

      // SALES
      case 'SALE_CREATED':
        sales.push(event.payload);
        break;
      case 'SALE_UPDATED':
        sales = sales.map(s => s.id === event.payload.id ? event.payload : s);
        break;
      case 'SALE_DELETED':
        sales = sales.filter(s => s.id !== event.payload.id);
        break;

      // PAYMENTS
      case 'PAYMENT_CREATED':
        payments.push(event.payload);
        break;
      case 'PAYMENT_UPDATED':
        payments = payments.map(p => p.id === event.payload.id ? event.payload : p);
        break;
      case 'PAYMENT_DELETED':
        payments = payments.filter(p => p.id !== event.payload.id);
        break;

      // RECEIPTS
      case 'RECEIPT_CREATED':
        receipts.push(event.payload);
        break;
      case 'RECEIPT_UPDATED':
        receipts = receipts.map(r => r.id === event.payload.id ? event.payload : r);
        break;
      case 'RECEIPT_DELETED':
        receipts = receipts.filter(r => r.id !== event.payload.id);
        break;

      // OTHER TRANSACTIONS
      case 'TRANSFER_CREATED':
        locationTransfers.push(event.payload);
        break;
      case 'ADJUSTMENT_CREATED':
        adjustments.push(event.payload);
        break;
      case 'RETURN_CREATED':
        if ('originalPurchaseId' in event.payload) {
          purchaseReturns.push(event.payload as PurchaseReturn);
        } else {
          saleReturns.push(event.payload as SaleReturn);
        }
        break;
        
      // LEDGER
      case 'LEDGER_ENTRY_CREATED':
        ledger.push(...event.payload);
        break;
      case 'LEDGER_ENTRY_DELETED':
        ledger = ledger.filter(l => l.relatedVoucher !== event.payload.voucherId);
        break;
    }
  });

  return {
    masterData,
    purchases,
    sales,
    adjustments,
    locationTransfers,
    purchaseReturns,
    saleReturns,
    payments,
    receipts,
    ledger
  };
}
