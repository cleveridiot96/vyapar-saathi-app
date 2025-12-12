import type { Purchase } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface PurchaseChittiPrintProps {
    purchase: Purchase;
}

export function PurchaseChittiPrint({ purchase }: PurchaseChittiPrintProps) {
  return (
    <div className="print-chitti-styles">
        <div className='flex-between mb-2'>
            <h1 className='font-bold text-lg'>Purchase Chitti</h1>
            <p className='text-sm'>ID: {purchase.id.slice(-6)}</p>
        </div>
        <div className='flex-between mb-1 text-sm'>
            <span>Date: <span className='font-bold'>{format(parseISO(purchase.date), 'dd/MM/yyyy')}</span></span>
            <span>Supplier: <span className='font-bold'>{purchase.supplierName}</span></span>
        </div>
         {purchase.agentName && <div className='mb-1 text-sm'>
            <span>Agent: <span className='font-bold'>{purchase.agentName}</span></span>
        </div>}
      <hr />
      <table>
        <thead>
          <tr>
            <th>Lot #</th>
            <th>Bags</th>
            <th>Net Wt.</th>
            <th>Rate</th>
            <th className='text-right'>Value</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items.map(item => (
            <tr key={item.id}>
              <td>{item.lotNumber}</td>
              <td>{item.quantity}</td>
              <td>{item.netWeight.toFixed(2)}</td>
              <td>{item.rate.toFixed(2)}</td>
              <td className='text-right'>{Math.round(item.goodsValue).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
        <div className="mt-2">
            <div className="flex-between py-1">
                <span>Total Goods Value:</span>
                <span className='font-bold'>₹{Math.round(purchase.totalGoodsValue).toLocaleString('en-IN')}</span>
            </div>
            {purchase.expenses && purchase.expenses.length > 0 && purchase.expenses.map(exp => (
                 <div key={exp.id} className="flex-between py-1">
                    <span>{exp.account}:</span>
                    <span className='font-bold'>₹{Math.round(exp.amount).toLocaleString('en-IN')}</span>
                 </div>
            ))}
        </div>
      <hr />
      <div className="flex-between font-bold mt-1 text-lg">
        <span>Total Amount:</span>
        <span>₹{Math.round(purchase.totalAmount).toLocaleString('en-IN')}</span>
      </div>
      <div className='mt-4 text-xs text-right'>
        <p>Total Bags: {Math.round(purchase.totalQuantity)}</p>
        <p>Total Net Wt: {purchase.totalNetWeight.toFixed(2)} kg</p>
        <p>Effective Rate: ₹{purchase.effectiveRate.toFixed(2)}/kg</p>
      </div>
    </div>
  );
}
