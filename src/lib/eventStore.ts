// ============================================================================
// ULTRA-LIGHT EVENT STORE - NO DEPENDENCIES
// ============================================================================
import type { Purchase, Sale, LocationTransfer, StockAdjustment, PurchaseReturn, SaleReturn, MasterItem, Payment, Receipt, LedgerEntry } from './types';


export type TransactionEvent = 
  | { type: 'MASTER_UPSERTED'; payload: MasterItem }
  | { type: 'PURCHASE_CREATED'; payload: Purchase }
  | { type: 'PURCHASE_UPDATED'; payload: Purchase }
  | { type: 'PURCHASE_DELETED'; payload: { id: string } }
  | { type: 'SALE_CREATED'; payload: Sale }
  | { type: 'SALE_UPDATED'; payload: Sale }
  | { type: 'SALE_DELETED'; payload:  { id: string } }
  | { type: 'PAYMENT_CREATED'; payload: Payment }
  | { type: 'PAYMENT_UPDATED'; payload: Payment }
  | { type: 'PAYMENT_DELETED'; payload: { id: string } }
  | { type: 'RECEIPT_CREATED'; payload: Receipt }
  | { type: 'RECEIPT_UPDATED'; payload: Receipt }
  | { type: 'RECEIPT_DELETED'; payload: { id: string } }
  | { type: 'TRANSFER_CREATED'; payload: LocationTransfer }
  | { type: 'ADJUSTMENT_CREATED'; payload: StockAdjustment }
  | { type: 'RETURN_CREATED'; payload: PurchaseReturn | SaleReturn }
  | { type: 'LEDGER_ENTRY_CREATED'; payload: LedgerEntry[] }
  | { type: 'LEDGER_ENTRY_DELETED'; payload: { voucherId: string } };

let eventLog: TransactionEvent[] = [];
let listeners: Set<(events: TransactionEvent[]) => void> = new Set();

/**
 * Initialize event log from IndexedDB on app start
 * This runs ONCE, so it's blazingly fast
 */
export async function initializeEventStore(): Promise<void> {
  const stored = await getFromIndexedDB<TransactionEvent[]>('events');
  if (stored) {
    eventLog = stored;
  }
}

/**
 * Add a transaction and persist to IndexedDB
 */
export function addEvent(event: TransactionEvent): void {
  eventLog.push(event);
  
  // Fire off async write (non-blocking)
  saveToIndexedDB('events', eventLog).catch(console.error);
  
  // Notify all listeners synchronously
  listeners.forEach(cb => cb(eventLog));
}

/**
 * Subscribe to changes
 */
export function onEventsChange(
  callback: (events: TransactionEvent[]) => void
): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Get all events
 */
export function getEvents(): TransactionEvent[] {
  return eventLog;
}

/**
 * Delete an event (soft delete by re-creating the stream)
 */
export function deleteEvent(eventIndex: number): void {
  eventLog.splice(eventIndex, 1);
  saveToIndexedDB('events', eventLog).catch(console.error);
  listeners.forEach(cb => cb(eventLog));
}

/**
 * Ultra-simple IndexedDB (no libraries!)
 */
const DB_NAME = 'InventoryDB';
const STORE_NAME = 'data';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request. onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(key: string, data: any): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store. put(data, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
