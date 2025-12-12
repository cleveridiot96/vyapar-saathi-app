"use client";

import type { LocationTransfer } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { PrintHeaderSymbol } from "@/components/shared/PrintHeaderSymbol";

interface LocationTransferSlipPrintProps {
  transfer: LocationTransfer;
}

export const LocationTransferSlipPrint: React.FC<LocationTransferSlipPrintProps> = ({ transfer }) => {
  if (!transfer) return null;
  
  const totalBags = transfer.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalNetWeight = transfer.items.reduce((sum, item) => sum + item.netWeight, 0);
  const totalExpenses = (transfer.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-4 bg-white text-black w-[550px] text-sm print-chitti-styles uppercase">
      <div className="text-center mb-4">
        <PrintHeaderSymbol className="text-lg" />
        <h1 className="text-xl font-bold mt-1">Location Transfer Slip</h1>
      </div>

      <div className="flex justify-between mb-2">
        <span>Date: <strong>{format(parseISO(transfer.date), "dd/MM/yy")}</strong></span>
        <span>Transfer ID: <strong>{transfer.id.slice(-6).toUpperCase()}</strong></span>
      </div>
      
      <div className="mb-2">
        From Warehouse: <strong>{transfer.fromLocationName}</strong>
      </div>
      <div className="mb-2">
        To Warehouse: <strong>{transfer.toLocationName}</strong>
      </div>
      
      <h3 className="font-semibold mt-4 mb-2">Items Transferred:</h3>
      <table className="text-xs">
        <thead>
          <tr>
            <th>Vakkal/Lot No.</th>
            <th className="text-right">Bags</th>
            <th className="text-right">Net Wt (kg)</th>
          </tr>
        </thead>
        <tbody>
          {transfer.items.map((item, index) => (
            <tr key={index}>
              <td>{item.newLotNumber}</td>
              <td className="text-right">{item.quantity.toLocaleString()}</td>
              <td className="text-right">{item.netWeight.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td>Total</td>
            <td className="text-right">{totalBags.toLocaleString()}</td>
            <td className="text-right">{totalNetWeight.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</td>
          </tr>
        </tfoot>
      </table>
      
       {totalExpenses > 0 && (
         <div className="mt-4 text-xs font-bold flex justify-between">
           <span>Total Transfer Charges:</span>
           <span>₹{totalExpenses.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
         </div>
       )}

      {transfer.notes && (
        <div className="mt-4 text-xs">
          Notes: <strong>{transfer.notes}</strong>
        </div>
      )}
      
      <div className="mt-8 pt-8 flex justify-between text-xs">
        <div>
          <p>Dispatched By Signature</p>
          <p className="mt-8 border-t border-gray-400 pt-1">____________________</p>
        </div>
        <div>
          <p>Received By Signature</p>
           <p className="mt-8 border-t border-gray-400 pt-1">____________________</p>
        </div>
      </div>
    </div>
  );
};
