"use client";

import type { Sale } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { PrintHeaderSymbol } from "@/components/shared/PrintHeaderSymbol";
import { useSettings } from "@/contexts/SettingsContext";

interface SaleChittiPrintProps {
  sale: Sale;
}

export const SaleChittiPrint: React.FC<SaleChittiPrintProps> = ({ sale }) => {
  const { financialYear } = useSettings(); // Using a dummy hook for now

  if (!sale) return null;
  
  const cashDiscount = (sale.expenses || []).find(e => e.account === 'Cash Discount')?.amount || 0;
  const totalSaleSideExpenses = (sale.expenses || []).filter(e => e.account !== 'Cash Discount').reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-4 bg-white text-black w-[550px] text-sm print-chitti-styles uppercase">
      <div className="text-center mb-4">
        <PrintHeaderSymbol className="text-lg" />
        <h1 className="text-xl font-bold mt-1">SALE VOUCHER</h1>
      </div>

      <div className="flex justify-between mb-2">
        <span>DATE: <strong>{format(parseISO(sale.date), "dd/MM/yy")}</strong></span>
        <span>BILL NO: <strong>{sale.billNumber || sale.id.slice(-6).toUpperCase()}</strong></span>
      </div>
      
      <div className="mb-2">
        CUSTOMER: <strong>{sale.customerName || sale.customerId}</strong>
      </div>
      
      {sale.brokerName && (
        <div className="mb-2">
          BROKER: <strong>{sale.brokerName}</strong>
        </div>
      )}
      
      {sale.items && sale.items.length > 0 && (
        <table className="text-xs">
          <thead>
            <tr>
              <th>VAKKAL / LOT NO.</th>
              <th className="text-right">BAGS</th>
              <th className="text-right">NET WT (KG)</th>
              <th className="text-right">RATE (₹/KG)</th>
              <th className="text-right">GOODS VALUE (₹)</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
               <tr key={index}>
                <td>{item.lotNumber}</td>
                <td className="text-right">{Math.round(item.quantity).toLocaleString()}</td>
                <td className="text-right">{item.netWeight.toLocaleString()}</td>
                <td className="text-right">{Math.round(item.rate || 0)}</td>
                <td className="text-right">{Math.round(item.goodsValue || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
              <tr className="font-bold">
                  <td colSpan={4}>TOTAL GOODS VALUE</td>
                  <td className="text-right">{Math.round(sale.totalGoodsValue || 0).toLocaleString()}</td>
              </tr>
          </tfoot>
        </table>
      )}

      <div className="mt-4 space-y-1">
        {cashDiscount > 0 && (
          <div className="flex justify-between text-destructive">
            <span>LESS: CASH DISCOUNT:</span>
            <span className="font-bold">(-) ₹{Math.round(cashDiscount).toLocaleString()}</span>
          </div>
        )}
         <div className="flex justify-between border-t pt-2 mt-2">
          <span className="font-bold text-base">NET AMOUNT PAYABLE:</span>
          <span className="font-bold text-base">₹{Math.round(sale.billedAmount || 0).toLocaleString()}</span>
        </div>
      </div>
      
      {sale.notes && (
        <div className="mt-4 text-xs">
          NOTES: <strong>{sale.notes}</strong>
        </div>
      )}
      
      <div className="mt-8 pt-8 flex justify-between text-xs">
        <div>
          <p>RECEIVER'S SIGNATURE</p>
          <p className="mt-8 border-t border-gray-400 pt-1">____________________</p>
        </div>
        <div>
          <p>FOR VYAPAR SAATHI</p>
           <p className="mt-8 border-t border-gray-400 pt-1">____________________</p>
        </div>
      </div>
    </div>
  );
};
