import type { Sale, Purchase, Payment, Receipt, MasterItem, LocationTransfer, SearchableItem } from './types';
import { format, parseISO } from 'date-fns';

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
    const saleDate = s.date ? format(parseISO(s.date), 'dd/MM/yy') : '';
    searchData.push({
      id: `sale-${s.id}`,
      type: 'Sale',
      title: `${s.billNumber || 'Sale'} to ${s.customerName}`,
      description: `Sold ${s.items.map(i => i.lotNumber).join(', ')} for ₹${Math.round(s.billedAmount)} on ${saleDate}. Broker: ${s.brokerName || 'None'}.`,
      date: s.date,
      href: `/sales#${s.id}`,
    });
  });

  purchases.forEach(p => {
    const purchaseDate = p.date ? format(parseISO(p.date), 'dd/MM/yy') : '';
    searchData.push({
      id: `purchase-${p.id}`,
      type: 'Purchase',
      title: `Purchase from ${p.supplierName}`,
      description: `Bought ${p.items.map(i => i.lotNumber).join(', ')} for ₹${Math.round(p.totalAmount)} on ${purchaseDate}. Agent: ${p.agentName || 'None'}.`,
      date: p.date,
      href: `/purchases#${p.id}`,
    });
  });

  payments.forEach(p => {
    const paymentDate = p.date ? format(parseISO(p.date), 'dd/MM/yy') : '';
    searchData.push({
      id: `payment-${p.id}`,
      type: 'Payment',
      title: `Payment to ${p.partyName}`,
      description: `Paid ₹${p.amount} via ${p.paymentMethod} on ${paymentDate}.`,
      date: p.date,
      href: `/payments#${p.id}`,
    });
  });

  receipts.forEach(r => {
    const receiptDate = r.date ? format(parseISO(r.date), 'dd/MM/yy') : '';
    searchData.push({
      id: `receipt-${r.id}`,
      type: 'Receipt',
      title: `Receipt from ${r.partyName}`,
      description: `Received ₹${r.amount} via ${r.paymentMethod} on ${receiptDate}.`,
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
      const transferDate = lt.date ? format(parseISO(lt.date), 'dd/MM/yy') : '';
      searchData.push({
          id: `transfer-${lt.id}`,
          type: 'Transfer',
          title: `Transfer from ${lt.fromLocationName} to ${lt.toLocationName}`,
          description: `Moved lots: ${lt.items.map(i => i.originalLotNumber).join(', ')} on ${transferDate}.`,
          date: lt.date,
          href: `/location-transfer#${lt.id}`
      })
  })

  return searchData;
};
