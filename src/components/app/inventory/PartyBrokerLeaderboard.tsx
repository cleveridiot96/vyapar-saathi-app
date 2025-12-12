"use client";
import React from 'react';
import type { AggregatedInventoryItem } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';

interface LeaderboardItem {
  name: string;
  value: number;
}

export const PartyBrokerLeaderboard = ({ items }: { items: AggregatedInventoryItem[] }) => {
  const { sales } = useTransactions();

  const supplierLeaderboard = React.useMemo(() => {
    const supplierData: Record<string, number> = {};
    items.forEach(item => {
      supplierData[item.supplierName] = (supplierData[item.supplierName] || 0) + item.cogs;
    });
    return Object.entries(supplierData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [items]);
  
  const customerLeaderboard = React.useMemo(() => {
    const customerData: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.customerName) {
        customerData[sale.customerName] = (customerData[sale.customerName] || 0) + sale.totalGoodsValue;
      }
    });
    return Object.entries(customerData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [sales]);

  const Leaderboard = ({ title, data }: { title: string, data: LeaderboardItem[] }) => (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {data.map((item, index) => (
            <li key={item.name} className="flex justify-between items-center text-sm">
              <span>{index + 1}. {item.name}</span>
              <span className="font-semibold">₹{Math.round(item.value).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Leaderboard title="Top Suppliers by Stock Value" data={supplierLeaderboard} />
      <Leaderboard title="Top Customers by Sales Value" data={customerLeaderboard} />
    </div>
  );
};
