"use client";

import React from 'react';
import { useTransactions, useMasters } from '@/hooks/useTransactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Debug component to diagnose what's actually happening with your data
 */
export function DebugDataDisplay() {
  const {
    purchases,
    sales,
    isTransactionsLoaded,
    payments,
    receipts,
  } = useTransactions();

  const {
    masters,
    masterData,
    isMastersLoaded,
  } = useMasters();

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border-2 border-blue-500">
      <h2 className="text-xl font-bold text-blue-700">🔍 Data Debug Panel</h2>
      
      {/* Loading Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loading Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            {isTransactionsLoaded ? (
              <CheckCircle2 className="text-green-600" />
            ) : (
              <AlertCircle className="text-yellow-600 animate-pulse" />
            )}
            <span>Transactions: {isTransactionsLoaded ? 'LOADED ✓' : 'LOADING...'}</span>
          </div>
          <div className="flex items-center gap-2">
            {isMastersLoaded ? (
              <CheckCircle2 className="text-green-600" />
            ) : (
              <AlertCircle className="text-yellow-600 animate-pulse" />
            )}
            <span>Masters: {isMastersLoaded ? 'LOADED ✓' : 'LOADING...'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Data Counts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw Data Counts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-bold">Sales</div>
              <div className="text-2xl">{sales?.length ?? 'undefined'}</div>
              <div className="text-xs text-gray-600">Type: {typeof sales}</div>
            </div>
            
            <div className="p-2 bg-purple-50 rounded">
              <div className="font-bold">Purchases</div>
              <div className="text-2xl">{purchases?.length ?? 'undefined'}</div>
              <div className="text-xs text-gray-600">Type: {typeof purchases}</div>
            </div>
            
            <div className="p-2 bg-green-50 rounded">
              <div className="font-bold">Receipts</div>
              <div className="text-2xl">{receipts?.length ?? 'undefined'}</div>
            </div>
            
            <div className="p-2 bg-orange-50 rounded">
              <div className="font-bold">Payments</div>
              <div className="text-2xl">{payments?.length ?? 'undefined'}</div>
            </div>
            
            <div className="p-2 bg-pink-50 rounded">
              <div className="font-bold">Masters (Total)</div>
              <div className="text-2xl">{masters?.length ?? 'undefined'}</div>
            </div>
            
            <div className="p-2 bg-yellow-50 rounded">
              <div className="font-bold">Customers</div>
              <div className="text-2xl">{masterData.Customer?.length ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sample Data Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sales && sales.length > 0 && (
            <div>
              <h3 className="font-bold text-green-700">✓ First Sale Found:</h3>
              <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(sales[0], null, 2)}
              </pre>
            </div>
          )}
          
          {purchases && purchases.length > 0 && (
            <div>
              <h3 className="font-bold text-blue-700">✓ First Purchase Found:</h3>
              <pre className="bg-blue-50 p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(purchases[0], null, 2)}
              </pre>
            </div>
          )}
          
          {(!sales || sales.length === 0) && (!purchases || purchases.length === 0) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ NO DATA FOUND</strong>
                <br />
                This means your IndexedDB is empty. You need to add data first!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Hook Values Raw */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hook Return Values (Raw)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-48">
{`useTransactions() returned:
- purchases: ${purchases === undefined ? 'undefined' : purchases === null ? 'null' : `array[${purchases.length}]`}
- sales: ${sales === undefined ? 'undefined' : sales === null ? 'null' : `array[${sales.length}]`}
- isTransactionsLoaded: ${isTransactionsLoaded}

useMasters() returned:
- masters: ${masters === undefined ? 'undefined' : masters === null ? 'null' : `array[${masters.length}]`}
- isMastersLoaded: ${isMastersLoaded}
- masterData.Customer: ${masterData.Customer?.length ?? 0} items
- masterData.Supplier: ${masterData.Supplier?.length ?? 0} items`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}