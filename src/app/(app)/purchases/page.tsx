"use client";

import { useAppDataContext } from '@/contexts/AppDataContext';

export default function PurchasesPage() {
  const { state } = useAppDataContext();

  console.log("DEBUG: Context State Purchases Length:", state.purchases.length);
  console.log("DEBUG: Actual Data:", state.purchases);

  return (
    <div className="p-6 bg-red-50 min-h-screen"> {/* Red background to prove we are looking at the right file */}
      <h1 className="text-3xl font-bold mb-4 text-red-900">PURCHASE PAGE DEBUG</h1>

      <div className="bg-white p-4 rounded shadow mb-4 border border-red-200">
        <h2 className="font-bold">Diagnostic Info:</h2>
        <p>Is App Loaded? {state.isLoaded ? "YES" : "NO"}</p>
        <p>Items found in Context: <span className="font-mono text-xl font-bold">{state.purchases.length}</span></p>
      </div>

      {state.purchases.length === 0 ? (
        <div className="p-8 bg-white rounded shadow text-center">
          <p className="text-xl">The Purchase Context is returning 0 items.</p>
          <p className="text-gray-500">This means the data is not in the 'purchases' table of the database.</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {state.purchases.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{p.id}</td>
                  <td className="p-4">{p.date}</td>
                  <td className="p-4">{p.supplierName}</td>
                  <td className="p-4">
                    {JSON.stringify(p).substring(0, 100)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
