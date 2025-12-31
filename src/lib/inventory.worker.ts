"use strict";
// ============================================================================
// WEB WORKER - Runs Off Main Thread
// ============================================================================
import { calculateInventory } from './inventoryEngine';
import type { TransactionEvent } from './eventStore';
import { deriveAllTransactions } from './derives';

// Worker message handler
self.onmessage = (event: MessageEvent<TransactionEvent[]>) => {
  try {
    const events = event.data;
    
    // Derive transactions from events
    const { 
      purchases, 
      sales, 
      adjustments, 
      locationTransfers, 
      purchaseReturns, 
      saleReturns 
    } = deriveAllTransactions(events);

    // Calculate inventory (heavy work, off main thread)
    const inventory = calculateInventory(
      purchases,
      sales,
      adjustments,
      locationTransfers,
      purchaseReturns,
      saleReturns
    );

    // Send result back
    self.postMessage(inventory);
  } catch (error) {
    console.error('Worker calculation error:', error);
    self.postMessage([]);
  }
};
