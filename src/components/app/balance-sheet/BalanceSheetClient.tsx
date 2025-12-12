"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useOutstandingBalances } from '@/hooks/useOutstandingBalances';
import { useInventory } from '@/hooks/useInventory';

export function BalanceSheetClient() {
    const { receivableParties, payableParties } = useOutstandingBalances();
    const { allAggregatedInventory } = useInventory();
    
    const totalReceivables = receivableParties.reduce((sum, party) => sum + party.balance, 0);
    const totalPayables = payableParties.reduce((sum, party) => sum + party.balance, 0);
    const totalStockValue = allAggregatedInventory.reduce((sum, item) => sum + item.cogs, 0);

    const netPosition = totalStockValue + totalReceivables + totalPayables;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Landmark/> Financial Summary</CardTitle>
                <CardDescription>A high-level overview of your business's financial position.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-800 flex items-center gap-2 text-lg"><Wallet/>Total Stock Value</CardTitle>
                            <CardDescription>Value of all current inventory (Assets)</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold text-blue-700">
                            {totalStockValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                        </CardContent>
                    </Card>
                     <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                            <CardTitle className="text-green-800 flex items-center gap-2 text-lg"><TrendingUp/>Total Receivables</CardTitle>
                             <CardDescription>Money owed to you by customers (Assets)</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold text-green-700">
                            {totalReceivables.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                        </CardContent>
                    </Card>
                     <Card className="bg-red-50 border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-800 flex items-center gap-2 text-lg"><TrendingDown/>Total Payables</CardTitle>
                            <CardDescription>Money you owe to suppliers (Liabilities)</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold text-red-700">
                           {Math.abs(totalPayables).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                        </CardContent>
                    </Card>
                     <Card className="bg-primary/10 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-primary flex items-center gap-2 text-lg">Net Position</CardTitle>
                            <CardDescription>Assets - Liabilities</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold text-primary">
                           {netPosition.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
