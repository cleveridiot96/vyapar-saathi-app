
"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Database } from 'lucide-react';

export function DatabaseDiagnostic() {
  const stats = useLiveQuery(async () => {
    const sales = await db.sales.count();
    const purchases = await db.purchases.count();
    const masters = await db.masters.count();
    const customers = await db.masters.where('type').equals('Customer').count();
    const brokers = await db.masters.where('type').equals('Broker').count();
    return { sales, purchases, masters, customers, brokers };
  });

  if (!stats) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-sm text-blue-600">Checking database...</span>
        </div>
      </div>
    );
  }

  const hasData = (stats.sales ?? 0) > 0 || (stats.purchases ?? 0) > 0;
  const hasMasters = (stats.customers ?? 0) > 0;

  return (
    <div className={`border rounded-lg p-4 ${hasData ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-start gap-3">
        <Database className={`w-5 h-5 mt-0.5 ${hasData ? 'text-green-600' : 'text-yellow-600'}`} />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2">Database Status</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Sales:</span>
              <span className="font-mono">{stats.sales ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Purchases:</span>
              <span className="font-mono">{stats.purchases ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Customers:</span>
              <span className="font-mono">{stats.customers ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Brokers:</span>
              <span className="font-mono">{stats.brokers ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Masters:</span>
              <span className="font-mono">{stats.masters ?? 0}</span>
            </div>
          </div>
          {!hasData && (
            <p className="mt-3 text-xs text-yellow-700 bg-yellow-100 rounded p-2">
              ⚠️ No data found. Database is empty. Add some data first!
            </p>
          )}
          {!hasMasters && hasData && (
            <p className="mt-3 text-xs text-yellow-700 bg-yellow-100 rounded p-2">
              ⚠️ No masters found. You need to add Customers/Brokers first!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
