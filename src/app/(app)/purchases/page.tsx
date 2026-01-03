
"use client";

import { useAppDataContext } from '@/contexts/AppDataContext';

export default function PurchasesPage() {
  const { state } = useAppDataContext();

  return (
    // CHANGED: Kept red background to verify you are seeing THIS file
    <div className="p-6 bg-red-50 min-h-screen space-y-6"> 
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <h1 className="text-3xl font-bold text-red-900 mb-2">PURCHASES (NUCLEAR VERSION)</h1>
        <p className="text-red-700">If you see this red box, you are looking at the correct file.</p>
        <p className="text-sm mt-2 font-mono">Records Found: {state.purchases.length}</p>
      </div>

      {/* THE REAL TABLE */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>

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
                  Supplier
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
                  <tr key={purchase.id} className="hover:bg-red-50 transition-colors"> {/* Changed hover to red tint */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {purchase.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.supplierName || 'Unknown'}
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
                      <p className="text-lg font-medium">No purchases found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
          Showing {state.purchases.length} records
        </div>
      </div>
    </div>
  );
}
