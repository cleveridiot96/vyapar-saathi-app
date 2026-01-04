"use client";

import { useState } from 'react';
import { db } from '../lib/db';
import { Database, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MasterItem } from '@/lib/types';
import { format } from 'date-fns';

export function TestDataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const masters = useLiveQuery(() => db.masters.toArray(), []) as MasterItem[] | undefined;

  const seedTestData = async () => {
    setIsSeeding(true);
    try {
      if (!masters || masters.length === 0) {
        alert('Masters not found. Please wait for them to seed first.');
        setIsSeeding(false);
        return;
      }
      
      const customers = masters.filter(m => m.type === 'Customer');
      const suppliers = masters.filter(w => w.type === 'Supplier');
      const warehouses = masters.filter(w => w.type === 'Warehouse');

      if (customers.length === 0 || suppliers.length === 0 || warehouses.length === 0) {
        alert('Required masters (Customer, Supplier, Warehouse) not found.');
        setIsSeeding(false);
        return;
      }

      await db.sales.bulkAdd([
        {
          id: 'test-sale-1',
          date: format(new Date(), 'yyyy-MM-dd'),
          customerId: customers[0].id,
          customerName: customers[0].name,
          billNumber: 'TEST-001',
          items: [{
            id: 'sitem-1', lotNumber: 'TEST-LOT-A', quantity: 10, netWeight: 500, rate: 100, goodsValue: 50000, purchaseRate: 0, costOfGoodsSold: 0, itemGrossProfit: 0, itemNetProfit: 0,
          }],
          totalGoodsValue: 50000, billedAmount: 50000, totalQuantity: 10, totalNetWeight: 500, totalCostOfGoodsSold: 0, totalGrossProfit: 0, totalCalculatedProfit: 0, isStockPaymentSale: false
        },
      ]);
      
      await db.purchases.bulkAdd([
         {
            id: 'test-purchase-1',
            date: format(new Date(), 'yyyy-MM-dd'),
            locationId: warehouses[0].id,
            locationName: warehouses[0].name,
            supplierId: suppliers[0].id,
            supplierName: suppliers[0].name,
            items: [{
                id: 'pitem-1', lotNumber: 'TEST-LOT-A', category: 'default', quantity: 100, netWeight: 5000, rate: 80, goodsValue: 400000, landedCostPerKg: 80,
            }],
            totalGoodsValue: 400000, totalQuantity: 100, totalNetWeight: 5000, totalAmount: 400000, effectiveRate: 80,
        },
      ]);

      alert('✅ Test data added successfully! Refresh if you don\'t see it.');
    } catch (error) {
      console.error('Error seeding test data:', error);
      alert('❌ Failed to seed test data. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear ALL transaction data (Sales and Purchases)? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      await db.sales.clear();
      await db.purchases.clear();
      alert('✅ All transaction data cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('❌ Failed to clear data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Database className="w-4 h-4" />
        Test Data Controls
      </h3>
      <div className="flex gap-3">
        <button
          onClick={seedTestData}
          disabled={isSeeding}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Database className="w-4 h-4" />
          {isSeeding ? 'Adding...' : 'Add Test Data'}
        </button>
        <button
          onClick={clearAllData}
          disabled={isClearing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Trash2 className="w-4 h-4" />
          {isClearing ? 'Clearing...' : 'Clear All Data'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Use these controls to quickly test if data is showing correctly in tables.
      </p>
    </div>
  );
}
