import { format, parseISO } from 'date-fns';
import type { Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, MasterItem } from '@/lib/types';

export interface SearchableItem {
  id:  string;
  type: 'Purchase' | 'Sale' | 'Transfer' | 'Adjustment' | 'Return' | 'Party';
  title: string;
  description: string;
  date?:  string;
  href: string;
}

export function buildSearchData({
  purchases = [],
  sales = [],
  adjustments = [],
  locationTransfers = [],
  purchaseReturns = [],
  saleReturns = [],
  masters = [],
}: {
  purchases?:  Purchase[];
  sales?: Sale[];
  adjustments?: StockAdjustment[];
  locationTransfers?: LocationTransfer[];
  purchaseReturns?: PurchaseReturn[];
  saleReturns?: SaleReturn[];
  masters?: MasterItem[];
} = {}): SearchableItem[] {
  const searchData: SearchableItem[] = [];

  (purchases ??  []).forEach(p => {
    if (!p) return;
    searchData.push({
      id: `purchase-${p.id}`,
      type: 'Purchase',
      title: `Purchase #${p.id.slice(-6)} from ${p.supplierName ??  'Unknown'}`,
      description: `Lots: ${p.items.map(i => i.lotNumber).join(', ')} on ${p.date ?? 'N/A'}`,
      date: p.date,
      href: `/purchases#${p.id}`,
    });
  });

  (sales ?? []).forEach(s => {
    if (!s) return;
    searchData.push({
      id: `sale-${s.id}`,
      type: 'Sale',
      title: `Sale #${s.billNumber || s.id.slice(-6)} to ${s.customerName ?? 'Unknown'}`,
      description: `Lots: ${s.items.map(i => i.lotNumber).join(', ')} on ${s.date ?? 'N/A'}`,
      date: s.date,
      href: `/sales#${s.id}`,
    });
  });

  (adjustments ?? []).forEach(adj => {
    if (!adj) return;
    searchData.push({
      id: `adjustment-${adj.id}`,
      type: 'Adjustment',
      title: `Adjustment for ${adj.lotNumber}`,
      description: `${adj.type} of ${adj.bags} bags on ${adj.date ?? 'N/A'}`,
      date: adj.date,
      href: `/stock-adjustments#${adj.id}`,
    });
  });

  (locationTransfers ?? []).forEach(lt => {
    if (!lt) return;
    const transferDate = lt.date ? format(parseISO(lt.date), 'dd/MM/yy') : '';
    searchData.push({
      id: `transfer-${lt.id}`,
      type: 'Transfer',
      title: `Transfer from ${lt.fromLocationName ?? 'Unknown'} to ${lt.toLocationName ?? 'Unknown'}`,
      description: `Moved lots: ${lt.items.map(i => i.originalLotNumber).join(', ')} on ${transferDate}`,
      date: lt.date,
      href: `/location-transfer#${lt.id}`,
    });
  });

  (purchaseReturns ?? []).forEach(pr => {
    if (!pr) return;
    searchData.push({
      id: `purchase-return-${pr.id}`,
      type: 'Return',
      title: `Purchase Return for lot ${pr.originalLotNumber}`,
      description: `Returned to ${pr.originalSupplierName} on ${pr.date ?? 'N/A'}`,
      date: pr.date,
      href: `/purchases#${pr.originalPurchaseId}`,
    });
  });

  (saleReturns ?? []).forEach(sr => {
    if (!sr) return;
    searchData.push({
      id: `sale-return-${sr.id}`,
      type: 'Return',
      title: `Sale Return for lot ${sr.originalLotNumber}`,
      description: `Returned from ${sr.originalCustomerName} on ${sr.date ?? 'N/A'}`,
      date: sr.date,
      href: `/sales#${sr.originalSaleId}`,
    });
  });
  
  (masters ?? []).forEach(m => {
    if (!m) return;
    searchData.push({
        id: `master-${m.id}`,
        type: 'Party',
        title: `${m.name} (${m.type})`,
        description: `Master entry for a ${m.type.toLowerCase()}`,
        href: `/accounts-ledger?partyId=${m.id}`
    })
  });

  return searchData;
}
