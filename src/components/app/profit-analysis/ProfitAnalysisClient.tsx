
"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Sale, TransactionalProfitInfo, CostBreakdown } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, DollarSign, BarChart3, CalendarDays, Rocket, Trophy, Calculator, ArrowDown, Zap, Plus, Minus, ChevronsRight } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, subDays, getDay } from "date-fns";
import { DatePickerWithRange } from "@/components/shared/DatePickerWithRange";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { isDateInFinancialYear } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterDataCombobox } from "@/components/shared/MasterDataCombobox";
import { cn } from "@/lib/utils";
import { useTransactions } from '@/hooks/useTransactions';
import Link from 'next/link';


interface MonthlySummaryInfo {
    monthKey: string;
    monthYear: string;
    transactionCount: number;
    netProfit: number;
}


interface ProfitKPIs {
  totalNetProfitForPeriod: number;
  totalNetProfitForFY: number;
  totalSalesValue: number;
  avgProfitPerSale: number;
  highestProfitSale: { 
    id: string; 
    profit: number; 
    billNumber?: string;
    customerName?: string;
    brokerName?: string;
  };
}

// Consolidated Row for Cost and Expense Display in Calculator
const CostRow: React.FC<{ label: string; value: number; isDeduction?: boolean; isSub?: boolean; isTotal?: boolean }> = ({ label, value, isDeduction = false, isSub = false, isTotal = false }) => (
    <TableRow className={cn(isTotal && 'bg-primary/10 font-bold text-base', !isTotal && 'hover:bg-transparent')}>
        <TableCell className={cn('py-1 text-sm', isSub ? 'pl-8' : 'pl-4', isTotal && 'text-primary')}>
            {!isTotal && (isDeduction ? <Minus className="h-3 w-3 inline-block mr-2 text-red-500" /> : <Plus className="h-3 w-3 inline-block mr-2 text-green-500" />)}
            {label}
        </TableCell>
        <TableCell className={cn("text-right py-1 font-mono text-sm", isTotal ? 'text-primary' : (isDeduction ? 'text-red-600' : 'text-green-600'))}>
            {isDeduction && value !== 0 && '(-)'} ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </TableCell>
    </TableRow>
);


export function ProfitAnalysisClient() {
  const { isAppHydrating } = useSettings();
  const { sales, isTransactionsLoaded } = useTransactions();
  const { financialYear: currentFinancialYearString } = useSettings();
  const [saleIdForCalc, setSaleIdForCalc] = React.useState<string | undefined>();
  const calculatorRef = useRef<HTMLDivElement>(null);
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: startOfMonth(today), to: endOfDay(today) };
  });

  useEffect(() => {
    if (saleIdForCalc && calculatorRef.current) {
        calculatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [saleIdForCalc]);

  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | undefined>();

  const allProfitTransactionsInFY = React.useMemo(() => {
    if (isAppHydrating || !isTransactionsLoaded) return [];
    const fySales = (sales ?? []).filter(sale => sale && isDateInFinancialYear(sale.date, currentFinancialYearString));
    
    const flattenedTransactions: TransactionalProfitInfo[] = [];
    fySales.forEach(sale => {
        if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) return;

        const saleSideExpensesTotal = (sale.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        sale.items.forEach(item => {
            const saleSideExpensesPerKg = sale.totalNetWeight > 0 ? saleSideExpensesTotal / sale.totalNetWeight : 0;
            const itemShareOfSaleExpenses = saleSideExpensesPerKg * item.netWeight;

            const landedCostPerKg = (item.costBreakdown?.baseRate || 0) + (item.costBreakdown?.purchaseExpenses || 0) + (item.costBreakdown?.transferExpenses || 0);
            const correctedCostOfGoodsSold = landedCostPerKg * item.netWeight;

            const grossProfit = item.goodsValue - correctedCostOfGoodsSold;
            const netProfit = grossProfit - itemShareOfSaleExpenses;

            flattenedTransactions.push({
                saleId: sale.id,
                date: sale.date,
                billNumber: sale.billNumber,
                customerName: sale.customerName,
                brokerName: sale.brokerName,
                lotNumber: item.lotNumber,
                saleNetWeightKg: item.netWeight,
                saleQuantityBags: item.quantity,
                basePurchaseRate: item.purchaseRate || 0,
                landedCostPerKg: landedCostPerKg,
                saleRatePerKg: item.rate,
                goodsValue: item.goodsValue,
                costOfGoodsSold: correctedCostOfGoodsSold,
                grossProfit: grossProfit,
                netProfit: netProfit,
                costBreakdown: item.costBreakdown || { baseRate: 0, purchaseExpenses: 0, transferExpenses: 0 },
                saleExpenses: { total: itemShareOfSaleExpenses }
            });
        });
    });
    return flattenedTransactions.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
}, [sales, isAppHydrating, isTransactionsLoaded, currentFinancialYearString]);


  const monthlySummaryForFY = React.useMemo(() => {
    const monthlyAgg: Record<string, { transactionCount: number; netProfit: number; }> = {};
    (allProfitTransactionsInFY ?? []).forEach(tx => {
        const monthKey = format(startOfMonth(parseISO(tx.date)), "yyyy-MM");
        if (!monthlyAgg[monthKey]) {
            monthlyAgg[monthKey] = { transactionCount: 0, netProfit: 0 };
        }
        monthlyAgg[monthKey].transactionCount++;
        monthlyAgg[monthKey].netProfit += tx.netProfit;
    });

    return Object.entries(monthlyAgg).map(([key, value]) => ({ monthKey: key, monthYear: format(parseISO(key + "-01"), "MMMM yyyy"), ...value }))
      .sort((a, b) => parseISO(b.monthKey).getTime() - parseISO(a.monthKey).getTime());
  }, [allProfitTransactionsInFY]);

  const filteredTransactionsForPeriod = React.useMemo(() => {
    if (!dateRange?.from) return [];
    const toDate = dateRange.to || dateRange.from;
    return (allProfitTransactionsInFY ?? []).filter(tx => isWithinInterval(parseISO(tx.date), { start: startOfDay(dateRange.from!), end: endOfDay(toDate) }));
  }, [allProfitTransactionsInFY, dateRange]);

  const kpiData = React.useMemo<ProfitKPIs>(() => {
    const totalNetProfitForPeriod = (filteredTransactionsForPeriod ?? []).reduce((sum, tx) => sum + (tx.netProfit || 0), 0);
    const totalNetProfitForFY = (allProfitTransactionsInFY ?? []).reduce((sum, tx) => sum + (tx.netProfit || 0), 0);

    const uniqueSalesInPeriod = [...new Set((filteredTransactionsForPeriod ?? []).map(tx => tx.saleId))];
    let highestProfitSale: ProfitKPIs['highestProfitSale'] = { id: 'N/A', profit: 0, billNumber: 'N/A', customerName: 'N/A', brokerName: undefined };
    
    if ((filteredTransactionsForPeriod ?? []).length > 0) {
      const profitBySale: Record<string, { profit: number; billNumber?: string; customerName?: string; brokerName?: string; }> = {};
      (filteredTransactionsForPeriod ?? []).forEach(tx => {
          if (!profitBySale[tx.saleId]) {
              profitBySale[tx.saleId] = { profit: 0, billNumber: tx.billNumber, customerName: tx.customerName, brokerName: tx.brokerName };
          }
          profitBySale[tx.saleId].profit += tx.netProfit || 0;
      });
      const topSale = Object.entries(profitBySale).sort((a,b) => b[1].profit - a[1].profit)[0];
      if (topSale) {
        highestProfitSale = { id: topSale[0], ...topSale[1] };
      }
    }

    const relevantSales = (sales ?? []).filter(s => {
      if (!s || !s.date || !dateRange?.from) return false;
      const toDate = dateRange.to || dateRange.from;
      return isWithinInterval(parseISO(s.date), { start: startOfDay(dateRange.from), end: endOfDay(toDate)});
    });
    
    return {
        totalNetProfitForPeriod,
        totalNetProfitForFY,
        totalSalesValue: relevantSales.reduce((sum, s) => sum + (s.billedAmount || 0), 0),
        avgProfitPerSale: uniqueSalesInPeriod.length > 0 ? totalNetProfitForPeriod / uniqueSalesInPeriod.length : 0,
        highestProfitSale,
    };
  }, [filteredTransactionsForPeriod, allProfitTransactionsInFY, sales, dateRange]);

  const setDateFilter = (type: "today" | "yesterday" | "dayBeforeYesterday" | "currentFY" | "ytd") => {
    let today = new Date();
    let from, to;
    const [startYearStr] = currentFinancialYearString.split('-');
    const currentFYStartYear = parseInt(startYearStr, 10);
    
    let targetDate = subDays(today, 2);
    if (type === "dayBeforeYesterday" && getDay(targetDate) === 0) {
        targetDate = subDays(today, 3);
    }
    
    switch (type) {
      case "today": from = startOfDay(today); to = endOfDay(today); break;
      case "yesterday": from = startOfDay(subDays(today, 1)); to = endOfDay(subDays(today, 1)); break;
      case "dayBeforeYesterday": from = startOfDay(targetDate); to = endOfDay(targetDate); break;
      case "currentFY":
        if (!isNaN(currentFYStartYear)) {
          from = new Date(currentFYStartYear, 3, 1);
          to = endOfDay(new Date(currentFYStartYear + 1, 2, 31));
        }
        break;
      case "ytd":
        if (!isNaN(currentFYStartYear)) {
          from = new Date(currentFYStartYear, 3, 1);
          to = endOfDay(today);
        }
        break;
    }
    setDateRange({ from, to });
  };

  const dayBeforeYesterday = subDays(new Date(), 2);
  const dayBeforeYesterdayButtonText = getDay(dayBeforeYesterday) === 0 ? 'Saturday' : format(dayBeforeYesterday, 'EEEE');
  
  const saleOptionsForCalc = React.useMemo(() => {
    const uniqueSalesMap = new Map<string, { label: string; value: string }>();
    (allProfitTransactionsInFY ?? []).forEach(tx => {
        if (!uniqueSalesMap.has(tx.saleId)) {
            uniqueSalesMap.set(tx.saleId, {
                value: tx.saleId,
                label: `BILL #${tx.billNumber || tx.saleId.slice(-5)} - ${tx.customerName}`
            });
        }
    });
    return Array.from(uniqueSalesMap.values());
  }, [allProfitTransactionsInFY]);

  const itemsForSelectedSaleCalc = React.useMemo(() => {
    if (!saleIdForCalc) return [];
    return (allProfitTransactionsInFY ?? []).filter(tx => tx.saleId === saleIdForCalc);
  }, [saleIdForCalc, allProfitTransactionsInFY]);

  const detailedMonthlyTransactions = React.useMemo(() => {
    if (!selectedMonthKey) return [];
    return (allProfitTransactionsInFY ?? []).filter(tx => format(startOfMonth(parseISO(tx.date)), "yyyy-MM") === selectedMonthKey);
  }, [selectedMonthKey, allProfitTransactionsInFY]);


  if (isAppHydrating || !isTransactionsLoaded) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p>Loading profit analysis...</p></div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-2xl">
          <CardHeader className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-3xl font-extrabold flex items-center uppercase tracking-wider"><Rocket className="mr-3 h-8 w-8"/>PROFIT ANALYSIS DASHBOARD</CardTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <DatePickerWithRange date={dateRange} onDateChange={setDateRange} className="bg-background/90 text-foreground" />
                <Button variant="secondary" size="sm" onClick={() => setDateFilter("today")}>Today</Button>
                <Button variant="secondary" size="sm" onClick={() => setDateFilter("yesterday")}>Yesterday</Button>
                <Button variant="secondary" size="sm" onClick={() => setDateFilter("ytd")}>YTD</Button>
                <Button variant="secondary" size="sm" onClick={() => setDateFilter("dayBeforeYesterday")}>{dayBeforeYesterdayButtonText}</Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md h-full text-white transform hover:scale-[1.02] transition-transform duration-300" style={{ background: 'linear-gradient(to top, #0ba360 0%, #3cba92 100%)' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">NET PROFIT (FY {currentFinancialYearString})</CardTitle>
                <DollarSign className="h-4 w-4 text-white/80"/>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${kpiData.totalNetProfitForFY < 0 ? 'text-red-300' : ''}`}>₹{Math.round(kpiData.totalNetProfitForFY || 0).toLocaleString('en-IN')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-md h-full text-white transform hover:scale-[1.02] transition-transform duration-300" style={{ background: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">TOTAL SALES VALUE (PERIOD)</CardTitle>
                <BarChart3 className="h-4 w-4 text-white/80"/>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{Math.round(kpiData.totalSalesValue || 0).toLocaleString('en-IN')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-md h-full text-white transform hover:scale-[1.02] transition-transform duration-300" style={{ background: 'linear-gradient(to right, #a18cd1 0%, #fbc2eb 100%)' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">AVG. PROFIT / SALE (PERIOD)</CardTitle>
                <TrendingUp className="h-4 w-4 text-white/80"/>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${kpiData.avgProfitPerSale < 0 ? 'text-red-300' : ''}`}>₹{Math.round(kpiData.avgProfitPerSale || 0).toLocaleString('en-IN')}</div>
              </CardContent>
            </Card>
            <Link href={`/sales#${kpiData.highestProfitSale.id}`} className="block h-full">
              <Card className="hover:bg-muted/20 h-full shadow-md text-white transform hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between" style={{ background: 'linear-gradient(to right, #243949 0%, #517fa4 100%)' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium uppercase">TOP SALE (PERIOD)</CardTitle>
                  <Trophy className="h-4 w-4 text-white/80"/>
                </CardHeader>
                <CardContent>
                  <div className="font-bold truncate uppercase">{kpiData.highestProfitSale.customerName}</div>
                  {kpiData.highestProfitSale.brokerName && <div className="text-xs uppercase">BROKER: {kpiData.highestProfitSale.brokerName}</div>}
                  <p className="text-xs uppercase mt-1">PROFIT: <span className="font-bold text-lg">₹{Math.round(kpiData.highestProfitSale.profit || 0).toLocaleString('en-IN')}</span></p>
                </CardContent>
              </Card>
            </Link>
        </div>

        <Tabs defaultValue="transactional" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transactional" className="text-base uppercase"><BarChart3 className="mr-2 h-5 w-5"/>TRANSACTIONAL DETAILS</TabsTrigger>
                <TabsTrigger value="monthly" className="text-base uppercase"><CalendarDays className="mr-2 h-5 w-5"/>MONTHLY SUMMARY</TabsTrigger>
                <TabsTrigger value="calculator" className="text-base uppercase"><Calculator className="mr-2 h-5 w-5"/>PROFIT CALCULATOR</TabsTrigger>
            </TabsList>
            <TabsContent value="transactional" className="mt-4">
                <Card>
                    <CardHeader className="p-4 bg-primary/10 rounded-t-xl">
                      <CardTitle className="text-xl uppercase text-primary">TRANSACTIONAL PROFIT DETAILS (SELECTED PERIOD)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredTransactionsForPeriod.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10 uppercase">NO TRANSACTIONS FOR THIS PERIOD.</p>
                        ) : (
                            <ScrollArea className="h-[60vh] rounded-b-xl border-t">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background shadow-sm z-10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="px-2 py-3 text-xs uppercase">DATE</TableHead>
                                            <TableHead className="px-2 py-3 text-xs uppercase">CUSTOMER</TableHead>
                                            <TableHead className="px-2 py-3 text-xs uppercase">VAKKAL</TableHead>
                                            <TableHead className="text-right px-2 py-3 text-xs uppercase">QTY (KG)</TableHead>
                                            <TableHead className="text-right px-2 py-3 text-xs uppercase">SALE RATE</TableHead>
                                            <TableHead className="text-right px-2 py-3 text-xs uppercase">LANDED COST</TableHead>
                                            <TableHead className="text-right px-2 py-3 text-xs uppercase">GROSS P/L</TableHead>
                                            <TableHead className="text-right px-2 py-3 text-xs uppercase">NET P/L</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactionsForPeriod.map((tx, index) => (
                                            <TableRow key={`${tx.saleId}-${tx.lotNumber}-${index}`} className="uppercase">
                                                <TableCell className="px-2 py-1 text-xs">{format(parseISO(tx.date), "dd/MM/yy")}</TableCell>
                                                <TableCell className="px-2 py-1 text-xs">{tx.customerName}</TableCell>
                                                <TableCell className="px-2 py-1 text-xs">{tx.lotNumber}</TableCell>
                                                <TableCell className="text-right px-2 py-1 text-xs">{tx.saleNetWeightKg.toLocaleString()}</TableCell>
                                                <TableCell className="text-right px-2 py-1 text-xs">{Math.round(tx.saleRatePerKg).toLocaleString()}</TableCell>
                                                <TableCell className="text-right px-2 py-1 text-xs">{Math.round(tx.landedCostPerKg).toLocaleString()}</TableCell>
                                                <TableCell className={`text-right font-medium px-2 py-1 text-xs ${tx.grossProfit >= 0 ? 'text-cyan-600' : 'text-orange-600'}`}>
                                                    {tx.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className={`text-right font-bold px-2 py-1 text-xs ${tx.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="monthly" className="mt-4">
              <Card>
                <CardHeader className="p-4 bg-primary/10 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl uppercase text-primary">
                      {selectedMonthKey ? `Details for ${monthlySummaryForFY.find(m => m.monthKey === selectedMonthKey)?.monthYear}` : `Monthly Summary (FY ${currentFinancialYearString})`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {selectedMonthKey && (
                        <Button variant="outline" onClick={() => setSelectedMonthKey(undefined)}>Back to Summary</Button>
                      )}
                      <MasterDataCombobox
                        value={selectedMonthKey}
                        onChange={setSelectedMonthKey}
                        options={monthlySummaryForFY.map(m => ({ value: m.monthKey, label: m.monthYear }))}
                        placeholder="Select a month..."
                        className="w-[200px]"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{selectedMonthKey ? 'Date' : 'Month'}</TableHead>
                          <TableHead className="text-right">{selectedMonthKey ? 'Vakkal' : 'Transactions'}</TableHead>
                          <TableHead className="text-right">{selectedMonthKey ? 'Customer' : 'Net Profit'}</TableHead>
                          {selectedMonthKey && <TableHead className="text-right">Net Profit</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMonthKey ? (
                          detailedMonthlyTransactions.map((tx, index) => (
                            <TableRow key={`${tx.saleId}-${tx.lotNumber}-${index}`}>
                              <TableCell>{format(parseISO(tx.date), "dd/MM/yy")}</TableCell>
                              <TableCell className="text-right">{tx.lotNumber}</TableCell>
                              <TableCell className="text-right">{tx.customerName}</TableCell>
                              <TableCell className={cn("text-right font-medium", tx.netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                                ₹{tx.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          monthlySummaryForFY.map(m => (
                            <TableRow key={m.monthKey} onClick={() => setSelectedMonthKey(m.monthKey)} className="cursor-pointer hover:bg-muted/50">
                              <TableCell className="font-semibold text-primary">{m.monthYear}</TableCell>
                              <TableCell className="text-right">{m.transactionCount}</TableCell>
                              <TableCell className={cn("text-right font-bold", m.netProfit >= 0 ? 'text-green-700' : 'text-red-700')} colSpan={2}>
                                ₹{m.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="calculator" className="mt-4">
                <Card>
                    <CardHeader className="p-4 bg-primary/10 rounded-t-xl">
                        <CardTitle className="text-xl uppercase text-primary">PROFIT &amp; COST CALCULATOR</CardTitle>
                        <div className="pt-2">
                            <MasterDataCombobox
                                value={saleIdForCalc}
                                onChange={setSaleIdForCalc}
                                options={saleOptionsForCalc}
                                placeholder="Select a Sale to Analyze..."
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!saleIdForCalc ? (
                             <div className="text-center py-10 text-muted-foreground uppercase">Please select a sale to see its detailed cost breakdown.</div>
                        ) : (
                            <div className="space-y-6">
                                {itemsForSelectedSaleCalc.map((item, index) => {
                                    const { costBreakdown, saleExpenses } = item;
                                    const netWeight = item.saleNetWeightKg || 1;
                                    const effectiveSaleRate = netWeight > 0 ? (item.goodsValue - saleExpenses.total) / netWeight : 0;
                                    const finalLandedCost = item.landedCostPerKg;
                                    const netProfitPerKg = effectiveSaleRate - finalLandedCost;
                                    const totalNetProfit = netProfitPerKg * netWeight;
                                    const originalLot = item.lotNumber.includes('/') ? item.lotNumber.split('/')[0] : item.lotNumber;

                                    return (
                                        <Card key={index} className="bg-muted/30 p-4">
                                            <CardHeader className="p-0 pb-3 border-b border-gray-200 mb-4">
                                                <CardTitle className="text-primary flex justify-between items-baseline text-lg">
                                                    <span>ITEM: {item.lotNumber} ({Math.round(item.saleQuantityBags)} BAGS / {item.saleNetWeightKg} KG)</span>
                                                    <span className="text-sm font-medium text-muted-foreground">{format(parseISO(item.date), "dd-MM-yyyy")}</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2 p-3 border rounded-lg bg-white shadow-sm">
                                                    <h3 className="font-semibold text-base text-primary flex items-center"><ArrowDown className="mr-2 h-4 w-4"/>LANDED COST/KG BREAKDOWN</h3>
                                                    <Table><TableBody>
                                                        <CostRow label={`Base Rate (${originalLot})`} value={costBreakdown.baseRate} />
                                                        {costBreakdown.purchaseExpenses > 0 ? <CostRow label="Purchase Expenses" value={costBreakdown.purchaseExpenses} isSub isDeduction /> : null}
                                                        {costBreakdown.transferExpenses > 0 ? <CostRow label="Transfer Expenses" value={costBreakdown.transferExpenses} isSub isDeduction /> : null}
                                                        <CostRow label="FINAL LANDED COST" value={finalLandedCost} isTotal />
                                                    </TableBody></Table>
                                                </div>
                                                <div className="space-y-2 p-3 border rounded-lg bg-white shadow-sm">
                                                    <h3 className="font-semibold text-base text-primary flex items-center"><Zap className="mr-2 h-4 w-4"/>SALE &amp; EXPENSE ANALYSIS/KG</h3>
                                                    <Table><TableBody>
                                                        <CostRow label="Sale Rate (Gross)" value={item.saleRatePerKg} />
                                                        {saleExpenses.total > 0 ? <CostRow label="Bill/Sale Expenses" value={saleExpenses.total / netWeight} isSub isDeduction /> : null} 
                                                        
                                                        <CostRow label="EFFECTIVE SALE RATE" value={effectiveSaleRate} isTotal />
                                                    </TableBody></Table>
                                                </div>
                                            </CardContent>
                                            
                                            <div className="mt-6 p-4 rounded-xl shadow-lg border border-gray-200 bg-white">
                                                <h4 className="text-center text-lg font-bold mb-3 uppercase text-gray-700">Net Profit Per Kilogram</h4>
                                                <div className="flex justify-around items-center text-lg md:text-xl font-mono">
                                                    <div className="text-center"><p className="text-xs text-gray-500">EFFECTIVE SALE RATE</p><p className="font-bold text-green-600">₹{effectiveSaleRate.toFixed(2)}</p></div>
                                                    <Minus className="h-6 w-6 text-gray-400" />
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">LANDED COST</p>
                                                        <Tooltip>
                                                          <TooltipTrigger asChild>
                                                            <p className="font-bold text-red-600 cursor-pointer underline decoration-dotted">₹{finalLandedCost.toFixed(2)}</p>
                                                          </TooltipTrigger>
                                                          <TooltipContent>
                                                            <p>Cost of acquisition for one KG.</p>
                                                          </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <ChevronsRight className="h-6 w-6 text-gray-400" />
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">NET P/L PER KG</p>
                                                        <p className={cn("font-bold text-xl", netProfitPerKg >= 0 ? 'text-green-600' : 'text-red-600')}>₹{netProfitPerKg.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className={cn("mt-4 p-4 rounded-lg text-center shadow-md", totalNetProfit >= 0 ? 'bg-green-50' : 'bg-red-50')}>
                                                    <h4 className="text-sm font-semibold uppercase text-gray-500">TOTAL NET PROFIT FOR THIS ITEM</h4>
                                                    <p className={cn("text-4xl font-extrabold", totalNetProfit >= 0 ? 'text-green-700' : 'text-red-700')}>
                                                        ₹{totalNetProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
