
"use client";
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/shared/DatePickerWithRange";
import { useTransactions } from '@/hooks/useTransactions';
import type { Sale } from '@/lib/types';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval, getYear, subMonths, subWeeks, startOfYear, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calculator, Trophy, BarChart, Scale } from "lucide-react";
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const MasterDataCombobox = dynamic(() => import('@/components/shared/MasterDataCombobox').then(mod => mod.MasterDataCombobox), { ssr: false });

export function ProfitAnalysisClient() {
    const { sales, isTransactionsLoaded } = useTransactions();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: new Date() });
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    const setDatePreset = (preset: 'ytd' | '6m' | '3m' | '1m' | '1w' | 'today') => {
      const to = endOfDay(new Date());
      let from;
      switch (preset) {
          case 'ytd': from = startOfYear(to); break;
          case '6m': from = startOfDay(subMonths(to, 6)); break;
          case '3m': from = startOfDay(subMonths(to, 3)); break;
          case '1m': from = startOfDay(subMonths(to, 1)); break;
          case '1w': from = startOfDay(subWeeks(to, 1)); break;
          case 'today': from = startOfDay(to); break;
      }
      setDateRange({ from, to });
    };

    const filteredSales: Sale[] = useMemo(() => {
        if (!isTransactionsLoaded || !dateRange?.from) return [];
        return sales.filter(s => {
            const saleDate = parseISO(s.date);
            return isWithinInterval(saleDate, { start: dateRange.from!, end: dateRange.to || new Date() });
        });
    }, [sales, dateRange, isTransactionsLoaded]);

    const kpis = useMemo(() => {
        if (filteredSales.length === 0) return { totalProfit: 0, totalSales: 0, avgProfitPerSale: 0, topSale: null };
        
        const totalProfit = filteredSales.reduce((acc, s) => acc + s.totalCalculatedProfit, 0);
        const totalSales = filteredSales.reduce((acc, s) => acc + s.totalGoodsValue, 0);
        const avgProfitPerSale = totalProfit / filteredSales.length;
        const topSale = filteredSales.reduce((max, s) => s.totalCalculatedProfit > max.totalCalculatedProfit ? s : max, filteredSales[0]);

        return { totalProfit, totalSales, avgProfitPerSale, topSale };
    }, [filteredSales]);

    const monthlySummary = useMemo(() => {
        const summary: Record<string, { month: string, profit: number, sales: number, count: number }> = {};
        filteredSales.forEach(s => {
            const monthKey = format(parseISO(s.date), 'yyyy-MM');
            if (!summary[monthKey]) {
                summary[monthKey] = { month: format(parseISO(s.date), 'MMM yyyy'), profit: 0, sales: 0, count: 0 };
            }
            summary[monthKey].profit += s.totalCalculatedProfit;
            summary[monthKey].sales += s.totalGoodsValue;
            summary[monthKey].count += 1;
        });
        return Object.values(summary).sort((a,b) => a.month.localeCompare(b.month));
    }, [filteredSales]);

    const selectedSaleDetails = useMemo(() => {
        if (!selectedSaleId) return null;
        return sales.find(s => s.id === selectedSaleId);
    }, [selectedSaleId, sales]);

    const saleOptions = useMemo(() => {
        return sales.map(s => ({
            value: s.id,
            label: `${s.billNumber || s.id.slice(-5)} - ${s.customerName} (${format(parseISO(s.date), 'dd/MM/yy')})`
        }));
    }, [sales]);

    if (!isTransactionsLoaded) {
        return <p>Loading analysis data...</p>;
    }

    return (
        <div className="space-y-6">
            <Card className="text-white" style={{background: 'linear-gradient(to top right, #a855f7, #ec4899)'}}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChart/> Profitability Analysis</CardTitle>
                    <CardDescription className="text-white/80">Analyze sales profitability over a selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">Today</Button>
                            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">1W</Button>
                            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">1M</Button>
                            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">3M</Button>
                            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">6M</Button>
                            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">YTD</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="text-white" style={{background: 'linear-gradient(135deg, #28a745, #218838)'}}><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign/>Total Net Profit</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">₹{kpis.totalProfit.toLocaleString('en-IN')}</p></CardContent></Card>
                <Card className="text-white" style={{background: 'linear-gradient(135deg, #17a2b8, #138496)'}}><CardHeader><CardTitle className="flex items-center gap-2"><BarChart/>Total Sales Value</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">₹{kpis.totalSales.toLocaleString('en-IN')}</p></CardContent></Card>
                <Card className="text-white" style={{background: 'linear-gradient(135deg, #ffc107, #e0a800)'}}><CardHeader><CardTitle className="text-black flex items-center gap-2"><Scale/>Avg. Profit/Sale</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-black">₹{kpis.avgProfitPerSale.toLocaleString('en-IN')}</p></CardContent></Card>
                <Card className="text-white" style={{background: 'linear-gradient(135deg, #dc3545, #c82333)'}}><CardHeader><CardTitle className="flex items-center gap-2"><Trophy/>Top Sale Profit</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">₹{kpis.topSale?.totalCalculatedProfit.toLocaleString('en-IN') || 'N/A'}</p></CardContent></Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
                 <Card>
                    <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
                    <CardContent>
                         <ScrollArea className="h-72">
                            <Table>
                                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Sales</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {monthlySummary.map(m => (
                                        <TableRow key={m.month}>
                                            <TableCell>{m.month}</TableCell>
                                            <TableCell className="text-right">₹{m.sales.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-right">₹{m.profit.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Calculator/> Profit Calculator</CardTitle><CardDescription>Select a sale to see a detailed profit breakdown.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <MasterDataCombobox options={saleOptions} value={selectedSaleId || ''} onChange={(value) => setSelectedSaleId(value || null)} placeholder="Select a sale..." />
                        {selectedSaleDetails && (
                             <ScrollArea className="h-60 p-2 border rounded-md">
                                {selectedSaleDetails.items.map(item => (
                                    <div key={item.id} className="p-3 border-b last:border-b-0">
                                        <h4 className="font-semibold text-primary">{item.lotNumber}</h4>
                                        <div className="text-xs space-y-1 mt-1">
                                            <div className="flex justify-between"><span>Sale Rate:</span> <span>₹{item.rate.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Landed Cost:</span> <span className="text-red-600">(-) ₹{((item.costOfGoodsSold / item.netWeight) || 0).toFixed(2)}</span></div>
                                            <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Net Profit/kg:</span> <span>₹{((item.itemNetProfit / item.netWeight) || 0).toFixed(2)}</span></div>
                                            <div className="flex justify-between font-bold text-lg"><span>Total Profit on Item:</span> <span>₹{item.itemNetProfit.toLocaleString('en-IN')}</span></div>
                                        </div>
                                    </div>
                                ))}
                             </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
