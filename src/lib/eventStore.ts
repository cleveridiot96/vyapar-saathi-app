"use strict";

import type { TransactionEvent } from '@/lib/types';
import { db } from './db';
import { liveQuery } from 'dexie';

let hasUnsavedChangesState = false;
let unsavedChangesListeners: Set<(hasChanges: boolean) => void> = new Set();

function notifyUnsavedChangesListeners() {
  unsavedChangesListeners.forEach(cb => cb(hasUnsavedChangesState));
}

export async function loadEvents(newEvents: TransactionEvent[]): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    await db.events.clear();
    await db.events.bulkAdd(newEvents);
  });
  hasUnsavedChangesState = false;
  notifyUnsavedChangesListeners();
}

export async function addEvent(event: TransactionEvent): Promise<void> {
  await db.events.add(event);
  hasUnsavedChangesState = true;
  notifyUnsavedChangesListeners();
}

export function useLiveEvents() {
    return liveQuery(() => db.events.toArray());
}

export function onUnsavedChangesChange(
  callback: (hasChanges: boolean) => void
): () => void {
  unsavedChangesListeners.add(callback);
  callback(hasUnsavedChangesState);
  return () => unsavedChangesListeners.delete(callback);
}

export function setHasUnsavedChanges(hasChanges: boolean): void {
  hasUnsavedChangesState = hasChanges;
  notifyUnsavedChangesListeners();
}
