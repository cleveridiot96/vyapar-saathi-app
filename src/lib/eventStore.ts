"use strict";

import type { TransactionEvent } from '@/lib/types';
import { db } from './db';
import { liveQuery } from 'dexie';

// This file now acts as a service layer on top of db.ts

let listeners: Set<() => void> = new Set();
let hasUnsavedChangesState = false;
let unsavedChangesListeners: Set<(hasChanges: boolean) => void> = new Set();


// Notify generic listeners that data has changed.
function notifyListeners() {
  listeners.forEach(cb => cb());
}

function notifyUnsavedChangesListeners() {
  unsavedChangesListeners.forEach(cb => cb(hasUnsavedChangesState));
}

// Replaces all events in the DB. Used for restoring from a backup.
export async function loadEvents(newEvents: TransactionEvent[]): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    await db.events.clear();
    await db.events.bulkAdd(newEvents);
  });
  hasUnsavedChangesState = false;
  notifyListeners();
  notifyUnsavedChangesListeners();
}

// Adds a single event to the DB.
export async function addEvent(event: TransactionEvent): Promise<void> {
  await db.events.add(event);
  hasUnsavedChangesState = true;
  // Dexie's liveQuery will handle notifying components, but we still need this for the unsaved changes flag
  notifyUnsavedChangesListeners();
}

// Retrieves all events.
export async function getEvents(): Promise<TransactionEvent[]> {
  return db.events.toArray();
}

// A hook-friendly way to subscribe to all events.
export function useLiveEvents() {
    return liveQuery(() => db.events.toArray());
}


// --- Unsaved Changes Logic ---

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

// Legacy subscription model, kept for compatibility during refactoring if needed,
// but useLiveEvents is preferred for new components.
export function onEventsChange(
  callback: () => void
): () => void {
  listeners.add(callback);
  // Initial call
  callback();
  return () => listeners.delete(callback);
}
