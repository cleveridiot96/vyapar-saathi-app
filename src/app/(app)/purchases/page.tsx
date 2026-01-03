
"use client";

import { useAppDataContext } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const { state } = useAppDataContext();

  return (
    <div className="flex flex-col h-full">
      
      {/* --- HEADER WITH ACTIONS --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 border-b bg-white gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Purchase Returns Button */}
          <Link href="/purchases/returns">
            <Button variant="outline" size="sm" className="h-9">
              Purchase Returns
            </Button>
          </Link>

          {/* New Purchase Button */}
          <Link href="/purchases/new">
            <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> New Purchase
            </Button>
          </Link>
        </div>
      </div>

      {/* --- TABLE AREA --- */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party / Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.purchases.length > 0 ? (
                  state.purchases.map((purchase: any) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 group-hover:underline">
                        {purchase.invoiceNo || purchase.id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.supplierName || purchase.partyName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.locationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        ₹{Number(purchase.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium">No purchases recorded yet.</p>
                        <p className="text-sm">Click "New Purchase" to add your first entry.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>Total: {state.purchases.length} entries</span>
          </div>
        </div>
      </div>

    </div>
  );
}
