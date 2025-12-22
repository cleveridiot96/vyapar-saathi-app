import type { AggregatedInventoryItem, Purchase, Sale, LocationTransfer, StockAdjustment, PurchaseReturn, SaleReturn, PurchaseItem } from '@/lib/types';
import { FIXED_WAREHOUSES } from '@/lib/constants';

const KEY_SEPARATOR = '_$_';

// Pure function: Inputs -> Output. No side effects.
export function calculateInventory(
    purchases: Purchase[],
    sales: Sale[],
    adjustments: StockAdjustment[],
    transfers: LocationTransfer[],
    purchaseReturns: PurchaseReturn[],
    saleReturns: SaleReturn[]
): AggregatedInventoryItem[] {
    
    const inventory: Record<string, AggregatedInventoryItem> = {};
    const mumbaiLocationId = FIXED_WAREHOUSES.find(fw => fw.name === 'Mumbai')?.id || 'wh-mumbai';

    // 1. Indexing (O(N)) - The "Nuclear" performance fix
    const purchaseMap = new Map<string, Purchase>();
    const lotToPurchaseItemMap = new Map<string, { purchase: Purchase, item: PurchaseItem }>();
    const saleMap = new Map<string, Sale>();

    purchases.forEach(p => {
        purchaseMap.set(p.id, p);
        p.items.forEach(item => {
            lotToPurchaseItemMap.set(item.lotNumber, { purchase: p, item });
        });
    });
    sales.forEach(s => saleMap.set(s.id, s));

    // 2. Helper to get or create inventory item
    const getOrCreateItem = (locationId: string, lotNumber: string, templateSource?: { purchase: Purchase, item: PurchaseItem }) => {
        const key = `${locationId}${KEY_SEPARATOR}${lotNumber}`;
        if (!inventory[key]) {
            // Default values
            let baseRate = 0;
            let effectiveRate = 0;
            let supplierName = 'N/A';
            let purchaseDate = new Date().toISOString();
            
            // If we can trace it back to a purchase, use that data
            if (templateSource) {
                baseRate = templateSource.item.rate;
                effectiveRate = templateSource.item.landedCostPerKg;
                supplierName = templateSource.purchase.supplierName;
                purchaseDate = templateSource.purchase.date;
            } 
            // Fallback: Try to find source via Lot Number Map
            else {
                const source = lotToPurchaseItemMap.get(lotNumber);
                if (source) {
                    baseRate = source.item.rate;
                    effectiveRate = source.item.landedCostPerKg;
                    supplierName = source.purchase.supplierName;
                    purchaseDate = source.purchase.date;
                }
            }

            inventory[key] = {
                key,
                lotNumber,
                originalBags: 0,
                currentBags: 0,
                currentWeight: 0,
                purchaseRate: baseRate,
                effectiveRate: effectiveRate,
                cogs: 0,
                locationId,
                locationName: 'Unknown', // Ideally map this from ID
                supplierName,
                purchaseDate,
                averageWeightPerBag: 50, // Default fallback
                costBreakdown: {
                    baseRate,
                    purchaseExpenses: effectiveRate - baseRate,
                    transferExpenses: 0,
                }
            };
        }
        return inventory[key];
    };

    // 3. Process Transactions
    
    // Purchases
    purchases.forEach(p => {
        p.items.forEach(item => {
            const entry = getOrCreateItem(p.locationId, item.lotNumber, { purchase: p, item });
            entry.locationName = p.locationName;
            entry.averageWeightPerBag = item.quantity > 0 ? item.netWeight / item.quantity : 0;
            
            entry.originalBags += item.quantity;
            entry.currentBags += item.quantity;
            entry.currentWeight += item.netWeight;
        });
    });

    // Adjustments
    adjustments.forEach(adj => {
        const entry = getOrCreateItem(adj.locationId, adj.lotNumber);
        entry.locationName = adj.locationName;
        entry.currentBags += adj.bags;
        entry.currentWeight += adj.weight;
        // If this was an "Initial Stock" adjustment, update original counts
        if (adj.type === 'Initial Stock') {
            entry.originalBags += adj.bags;
        }
    });

    // Transfers
    transfers.forEach(lt => {
        lt.items.forEach(item => {
            // Source
            const sourceEntry = getOrCreateItem(lt.fromLocationId, item.originalLotNumber);
            sourceEntry.currentBags -= item.quantity;
            sourceEntry.currentWeight -= item.netWeight;

            // Destination
            const destEntry = getOrCreateItem(lt.toLocationId, item.newLotNumber);
            destEntry.locationName = lt.toLocationName;
            
            // Calc transfer costs
            const transferCostPerKg = item.netWeight > 0 
                ? (lt.totalTransferCost / lt.items.reduce((s, i) => s + i.netWeight, 0)) 
                : 0;

            // Inherit cost basis from source
            destEntry.purchaseRate = sourceEntry.purchaseRate;
            destEntry.effectiveRate = sourceEntry.effectiveRate + transferCostPerKg;
            destEntry.costBreakdown.baseRate = sourceEntry.costBreakdown.baseRate;
            destEntry.costBreakdown.purchaseExpenses = sourceEntry.costBreakdown.purchaseExpenses;
            destEntry.costBreakdown.transferExpenses = (sourceEntry.costBreakdown.transferExpenses || 0) + transferCostPerKg;
            
            destEntry.originalBags += item.quantity;
            destEntry.currentBags += item.quantity;
            destEntry.currentWeight += item.netWeight;
        });
    });

    // Returns
    purchaseReturns.forEach(pr => {
        const purchase = purchaseMap.get(pr.originalPurchaseId);
        if (purchase) {
            const entry = getOrCreateItem(purchase.locationId, pr.originalLotNumber);
            entry.currentBags -= pr.quantityReturned;
            entry.currentWeight -= pr.netWeightReturned;
        }
    });

    saleReturns.forEach(sr => {
        // Returns usually go to a default warehouse or the original one. 
        // Using Mumbai/Default as fallback logic
        const entry = getOrCreateItem(mumbaiLocationId, sr.originalLotNumber);
        entry.currentBags += sr.quantityReturned;
        entry.currentWeight += sr.netWeightReturned;
    });

    // Sales
    sales.forEach(s => {
        s.items.forEach(item => {
            const locationId = (s as any).locationId || mumbaiLocationId;
            const entry = getOrCreateItem(locationId, item.lotNumber);
            entry.currentBags -= item.quantity;
            entry.currentWeight -= item.netWeight;
        });
    });

    // Final Calculations
    return Object.values(inventory).map(item => {
        item.cogs = item.currentWeight * item.effectiveRate;
        return item;
    });
}
