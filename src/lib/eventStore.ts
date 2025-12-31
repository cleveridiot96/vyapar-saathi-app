"use strict";

import type { 
  Purchase, 
  Sale, 
  StockAdjustment, 
  LocationTransfer,
  PurchaseReturn,
  SaleReturn,
  MasterItem,
  Payment,
  Receipt,
  LedgerEntry
} from '@/lib/types';

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
let isInitialized = false;

export async function initializeEventStore(): Promise<void> {
  if (isInitialized) return;
  
  // Asynchronously load data. This allows the UI to render immediately.
  try {
    const stored = await getFromIndexedDB<TransactionEvent[]>('events');
    if (stored && Array.isArray(stored)) {
      eventLog = stored;
    }
  } catch(e) {
    console.error("Failed to load events from storage", e);
  } finally {
    isInitialized = true;
    // Notify listeners that initial data is loaded
    listeners.forEach(cb => cb([...eventLog]));
  }
}

export function addEvent(event: TransactionEvent): void {
  eventLog.push(event);
  saveToIndexedDB('events', eventLog).catch(console.error);
  listeners.forEach(cb => cb([...eventLog]));
}

export function onEventsChange(
  callback: (events: TransactionEvent[]) => void
): () => void {
  listeners.add(callback);
  // If already initialized, give the new listener the current data immediately.
  if (isInitialized) {
      callback([...eventLog]);
  }
  return () => listeners.delete(callback);
}

export function getEvents(): TransactionEvent[] {
  return [...eventLog];
}

export function deleteEvent(eventIndex: number): void {
  eventLog.splice(eventIndex, 1);
  saveToIndexedDB('events', eventLog).catch(console.error);
  listeners.forEach(cb => cb([...eventLog]));
}

const DB_NAME = 'InventoryDB';
const STORE_NAME = 'data';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(key: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(data, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
    throw error;
  }
}

export async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to read from IndexedDB:', error);
    return null;
  }
}
