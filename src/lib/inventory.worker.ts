// ============================================================================
// WEB WORKER - Runs Off Main Thread
// ============================================================================

import { calculateInventory } from './inventoryEngine';
import type { TransactionEvent } from './eventStore';
import { deriveAllTransactions } from './derives';

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<TransactionEvent[]>) => {
  const events = event.data;
  
  // Derive transactions from events
  const { purchases, sales, adjustments, locationTransfers, purchaseReturns, saleReturns } =
    deriveAllTransactions(events);

  // Calculate inventory (heavy work, but OFF main thread)
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
};
