import type { Sale, Purchase, Payment, Receipt, MasterItem, LocationTransfer, SearchableItem } from './types';

interface BuildSearchDataArgs {
  sales: Sale[];
  purchases: Purchase[];
  payments: Payment[];
  receipts: Receipt[];
  masters: MasterItem[];
  locationTransfers: LocationTransfer[];
}

export const buildSearchData = ({
  sales,
  purchases,
  payments,
  receipts,
  masters,
  locationTransfers,
}: BuildSearchDataArgs): SearchableItem[] => {
  const searchData: SearchableItem[] = [];

  sales.forEach(s => {
    searchData.push({
      id: `sale-${s.id}`,
      type: 'Sale',
      title: s.billNumber || `Sale to ${s.customerName}`,
      description: `Sold ${s.items.map(i => i.lotNumber).join(', ')} for ₹${s.billedAmount}`,
      date: s.date,
      href: `/sales#${s.id}`,
    });
  });

  purchases.forEach(p => {
    searchData.push({
      id: `purchase-${p.id}`,
      type: 'Purchase',
      title: `Purchase from ${p.supplierName}`,
      description: `Bought ${p.items.map(i => i.lotNumber).join(', ')} for ₹${p.totalAmount}`,
      date: p.date,
      href: `/purchases#${p.id}`,
    });
  });

  payments.forEach(p => {
    searchData.push({
      id: `payment-${p.id}`,
      type: 'Payment',
      title: `Payment to ${p.partyName}`,
      description: `Paid ₹${p.amount} via ${p.paymentMethod}`,
      date: p.date,
      href: `/payments#${p.id}`,
    });
  });

  receipts.forEach(r => {
    searchData.push({
      id: `receipt-${r.id}`,
      type: 'Receipt',
      title: `Receipt from ${r.partyName}`,
      description: `Received ₹${r.amount} via ${r.paymentMethod}`,
      date: r.date,
      href: `/receipts#${r.id}`,
    });
  });
  
  masters.forEach(m => {
      searchData.push({
          id: `master-${m.id}`,
          type: 'Party',
          title: `${m.name} (${m.type})`,
          description: `Master entry for a ${m.type.toLowerCase()}`,
          href: `/accounts-ledger?partyId=${m.id}`
      })
  })

  locationTransfers.forEach(lt => {
      searchData.push({
          id: `transfer-${lt.id}`,
          type: 'Transfer',
          title: `Transfer from ${lt.fromLocationName} to ${lt.toLocationName}`,
          description: `Moved lots: ${lt.items.map(i => i.originalLotNumber).join(', ')}`,
          date: lt.date,
          href: `/location-transfer#${lt.id}`
      })
  })

  return searchData;
};
