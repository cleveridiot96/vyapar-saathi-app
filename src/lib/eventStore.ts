
"use strict";

import type { TransactionEvent } from '@/lib/types';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'InventoryDB';
const STORE_NAME = 'events';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // FIX: Removed `keyPath` to allow auto-incrementing keys for the event log.
          db.createObjectStore(STORE_NAME, {
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

let listeners: Set<(events: TransactionEvent[]) => void> = new Set();
let hasUnsavedChangesState = false;
let unsavedChangesListeners: Set<(hasChanges: boolean) => void> = new Set();

async function notifyListeners() {
  const events = await getEvents();
  listeners.forEach(cb => cb(events));
}

function notifyUnsavedChangesListeners() {
  unsavedChangesListeners.forEach(cb => cb(hasUnsavedChangesState));
}

export async function loadEvents(newEvents: TransactionEvent[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await Promise.all(newEvents.map(event => tx.objectStore(STORE_NAME).put(event)));
  await tx.done;
  hasUnsavedChangesState = false;
  notifyListeners();
  notifyUnsavedChangesListeners();
}

export async function addEvent(event: TransactionEvent): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, event);
  hasUnsavedChangesState = true;
  notifyListeners();
  notifyUnsavedChangesListeners();
}

export function onEventsChange(
  callback: (events: TransactionEvent[]) => void
): () => void {
  listeners.add(callback);
  // Initial load
  getEvents().then(events => callback(events));
  return () => listeners.delete(callback);
}

export function onUnsavedChangesChange(
  callback: (hasChanges: boolean) => void
): () => void {
  unsavedChangesListeners.add(callback);
  callback(hasUnsavedChangesState);
  return () => unsavedChangesListeners.delete(callback);
}

export async function getEvents(): Promise<TransactionEvent[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export function setHasUnsavedChanges(hasChanges: boolean): void {
  hasUnsavedChangesState = hasChanges;
  notifyUnsavedChangesListeners();
}
