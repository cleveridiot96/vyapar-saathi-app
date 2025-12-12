import type { Purchase } from '@/lib/types';

interface PurchaseChittiPrintProps {
    purchase: Purchase;
}

export function PurchaseChittiPrint({ purchase }: PurchaseChittiPrintProps) {
  return (
    <div className="print-chitti-styles">
      <h1>Purchase Chitti</h1>
      <p>ID: {purchase.id}</p>
      <p>Date: {purchase.date}</p>
      <p>Supplier: {purchase.supplierName}</p>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Lot #</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items.map(item => (
            <tr key={item.id}>
              <td>{item.lotNumber}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>{item.rate}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right font-bold">
        Total: {purchase.totalAmount}
      </div>
    </div>
  );
}
