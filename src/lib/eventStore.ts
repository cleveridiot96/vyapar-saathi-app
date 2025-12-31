"use strict";

import type { 
  TransactionEvent,
} from '@/lib/types';

// This is now just an in-memory store.
let eventLog: TransactionEvent[] = [];
let listeners: Set<(events: TransactionEvent[]) => void> = new Set();
let hasUnsavedChangesState = false;
let unsavedChangesListeners: Set<(hasChanges: boolean) => void> = new Set();

function notifyListeners() {
  listeners.forEach(cb => cb([...eventLog]));
}

function notifyUnsavedChangesListeners() {
  unsavedChangesListeners.forEach(cb => cb(hasUnsavedChangesState));
}

// Replaces all events in the log. Used for loading from a file.
export function loadEvents(newEvents: TransactionEvent[]): void {
  eventLog = newEvents;
  hasUnsavedChangesState = false; // Freshly loaded data is "saved"
  notifyListeners();
  notifyUnsavedChangesListeners();
}

export function addEvent(event: TransactionEvent): void {
  eventLog.push(event);
  hasUnsavedChangesState = true;
  notifyListeners();
  notifyUnsavedChangesListeners();
}

export function onEventsChange(
  callback: (events: TransactionEvent[]) => void
): () => void {
  listeners.add(callback);
  // Give the new listener the current data immediately.
  callback([...eventLog]);
  return () => listeners.delete(callback);
}

export function onUnsavedChangesChange(
  callback: (hasChanges: boolean) => void
): () => void {
    listeners.add(callback as any);
    callback(hasUnsavedChangesState);
    return () => listeners.delete(callback as any);
}


export function getEvents(): TransactionEvent[] {
  return [...eventLog];
}

export function setHasUnsavedChanges(hasChanges: boolean): void {
    hasUnsavedChangesState = hasChanges;
    notifyUnsavedChangesListeners();
}
