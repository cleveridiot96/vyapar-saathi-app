"use client";

import React, { useMemo, useEffect } from 'react';
import type { MasterItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { BookUser, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useSearchParams, useRouter } from "next/navigation";
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTransactions } from "@/hooks/useTransactions";
import { useHydrated } from '@/hooks/useHydrated';
import dynamic from 'next/dynamic';
import { isDateInFinancialYear } from '@/lib/utils';
import { useAppState } from '@/hooks/useAppState';

const MasterDataCombobox = dynamic(() => import('@/components/shared/MasterDataCombobox').then(mod => mod.MasterDataCombobox), { ssr: false });

interface FinancialLedgerTransaction {
  id: string;
  date: string;
  particulars: string;
  voucherType: string;
  voucherNo?: string;
  debit: number;
  credit: number;
  balance: number;
  href?: string;
}

const initialLedgerData = {
  transactions: [] as FinancialLedgerTransaction[],
  openingBalance: 0,
  closingBalance: 0,
  totalDebit: 0,
  totalCredit: 0,
};

export function AccountsLedgerClient() {
  const isHydrated = useHydrated();
  const { financialYear, isAppHydrating } = useSettings();
  const { 
    purchases, 
    sales, 
    payments, 
    receipts, 
    getAllMasters
  } = useAppState();
  
  const [selectedPartyId, setSelectedPartyId] = React.useState<string>("");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const partyIdFromQuery = searchParams.get('partyId');
  const allMasters = useMemo(() => getAllMasters(), [getAllMasters]);

  useEffect(() => {
    if (isAppHydrating || !isHydrated) return;
    if (partyIdFromQuery && allMasters.some(m => m.id === partyIdFromQuery) && selectedPartyId !== partyIdFromQuery) {
      setSelectedPartyId(partyIdFromQuery);
    }
  }, [isAppHydrating, isHydrated, partyIdFromQuery, selectedPartyId, allMasters]);

  const partyOptions = useMemo(() => {
    return allMasters.map(p => ({ value: p.id, label: `${p.name} (${p.type})` }));
  }, [allMasters]);

  const ledgerData = useMemo(() => {
    if (!selectedPartyId || !isHydrated) return initialLedgerData;

    let openingBalance = 0;
    const periodTransactions: FinancialLedgerTransaction[] = [];
    
    // Calculate Opening Balance
    sales.forEach(s => {
      if (!isDateInFinancialYear(s.date, financialYear) && (s.customerId === selectedPartyId || s.brokerId === selectedPartyId)) {
        openingBalance += s.billedAmount;
      }
    });
    purchases.forEach(p => {
      if (!isDateInFinancialYear(p.date, financialYear) && (p.supplierId === selectedPartyId || p.agentId === selectedPartyId)) {
        openingBalance -= p.totalAmount;
      }
    });
    receipts.forEach(r => {
      if (!isDateInFinancialYear(r.date, financialYear) && r.partyId === selectedPartyId) {
        openingBalance -= (r.amount + (r.cashDiscount || 0));
      }
    });
     payments.forEach(p => {
      if (!isDateInFinancialYear(p.date, financialYear) && p.partyId === selectedPartyId) {
        openingBalance += p.amount;
      }
    });

    // Process Period Transactions
    sales.forEach(s => {
      if (isDateInFinancialYear(s.date, financialYear) && (s.customerId === selectedPartyId || s.brokerId === selectedPartyId)) {
        periodTransactions.push({ id: `sale-${s.id}`, date: s.date, particulars: `Sold: ${s.items.map(i=>i.lotNumber).join(', ')}`, voucherType: 'Sale', voucherNo: s.billNumber, debit: s.billedAmount, credit: 0, balance: 0, href: `/sales#${s.id}` });
      }
    });
    purchases.forEach(p => {
      if (isDateInFinancialYear(p.date, financialYear) && (p.supplierId === selectedPartyId || p.agentId === selectedPartyId)) {
        periodTransactions.push({ id: `pur-${p.id}`, date: p.date, particulars: `Purchased: ${p.items.map(i=>i.lotNumber).join(', ')}`, voucherType: 'Purchase', debit: 0, credit: p.totalAmount, balance: 0, href: `/purchases#${p.id}` });
      }
    });
    receipts.forEach(r => {
      if (isDateInFinancialYear(r.date, financialYear) && r.partyId === selectedPartyId) {
        const totalCredit = r.amount + (r.cashDiscount || 0);
        periodTransactions.push({ id: `rec-${r.id}`, date: r.date, particulars: `Received via ${r.paymentMethod}`, voucherType: 'Receipt', debit: 0, credit: totalCredit, balance: 0, href: `/receipts#${r.id}` });
      }
    });
     payments.forEach(p => {
      if (isDateInFinancialYear(p.date, financialYear) && p.partyId === selectedPartyId) {
        periodTransactions.push({ id: `pay-${p.id}`, date: p.date, particulars: `Paid via ${p.paymentMethod}`, voucherType: 'Payment', debit: p.amount, credit: 0, balance: 0, href: `/payments#${p.id}` });
      }
    });

    periodTransactions.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    let runningBalance = openingBalance;
    const transactionsWithBalance = periodTransactions.map(tx => {
      runningBalance = runningBalance + tx.debit - tx.credit;
      return { ...tx, balance: runningBalance };
    });

    const totalDebit = transactionsWithBalance.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = transactionsWithBalance.reduce((sum, tx) => sum + tx.credit, 0);

    return { transactions: transactionsWithBalance, openingBalance, closingBalance: runningBalance, totalDebit, totalCredit };
  }, [selectedPartyId, purchases, sales, payments, receipts, isHydrated, financialYear]);

  const handlePartySelect = (value: string | undefined) => {
    setSelectedPartyId(value || "");
    const newPath = value ? `/accounts-ledger?partyId=${value}` : '/accounts-ledger';
    router.push(newPath, { scroll: false });
  };
  
  const selectedPartyDetails = useMemo(() => {
    if (!selectedPartyId || allMasters.length === 0) return undefined;
    return allMasters.find(p => p.id === selectedPartyId);
  }, [selectedPartyId, allMasters]);
  

  if (isAppHydrating || !isHydrated) {
    return <div className="flex justify-center items-center h-full"><p>Loading ledger...</p></div>;
  }
  
  return (
    <div className="space-y-4 print-area flex flex-col h-[calc(100vh-8rem)]">
        <Card className="shadow-md no-print flex-shrink-0">
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">ACCOUNT LEDGER</h1>
                     <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <MasterDataCombobox
                            value={selectedPartyId}
                            onChange={handlePartySelect}
                            options={partyOptions}
                            placeholder="SELECT PARTY..."
                            searchPlaceholder="SEARCH PARTIES..."
                            notFoundMessage="NO PARTY FOUND."
                            className="h-9 text-base w-full md:w-64"
                        />
                        <Button variant="outline" size="icon" onClick={() => window.print()} title="Print"><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
        {selectedPartyId && selectedPartyDetails ? (
             <div className="flex-grow flex flex-col min-h-0">
                <PrintHeaderSymbol className="hidden print:block" />
                <CardHeader className="pt-2 pb-4">
                  <CardTitle className="text-xl">Statement for {selectedPartyDetails.name}</CardTitle>
                  <CardDescription>
                    For Financial Year {financialYear}
                  </CardDescription>
                </CardHeader>
                 <ScrollArea className="flex-grow border rounded-md">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Date</TableHead>
                                <TableHead>Particulars</TableHead>
                                <TableHead className="w-24 text-right">Debit (₹)</TableHead>
                                <TableHead className="w-24 text-right">Credit (₹)</TableHead>
                                <TableHead className="w-32 text-right">Balance (₹)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="font-semibold bg-muted/30">
                                <TableCell colSpan={4}>OPENING BALANCE</TableCell>
                                <TableCell className="text-right">{ledgerData.openingBalance.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            {ledgerData.transactions.length > 0 ? (
                                ledgerData.transactions.map(tx => (
                                    <TableRow key={tx.id} onClick={() => tx.href && router.push(tx.href)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>{format(parseISO(tx.date), "dd/MM/yy")}</TableCell>
                                        <TableCell>{tx.particulars}</TableCell>
                                        <TableCell className="text-right font-mono">{tx.debit > 0 ? tx.debit.toLocaleString('en-IN') : '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-green-600">{tx.credit > 0 ? tx.credit.toLocaleString('en-IN') : '-'}</TableCell>
                                        <TableCell className="text-right font-semibold font-mono">{tx.balance.toLocaleString('en-IN')} {tx.balance >= 0 ? 'Dr' : 'Cr'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center h-48">No transactions in this period.</TableCell></TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold text-base bg-muted">
                                <TableCell colSpan={2}>Period Total</TableCell>
                                <TableCell className="text-right">{ledgerData.totalDebit.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right">{ledgerData.totalCredit.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right">{ledgerData.closingBalance.toLocaleString('en-IN')} {ledgerData.closingBalance >= 0 ? 'Dr' : 'Cr'}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                 </ScrollArea>
             </div>
        ) : (
             <Card className="shadow-lg border-dashed border-2 border-muted-foreground/30 bg-muted/20 flex-grow flex items-center justify-center no-print cursor-pointer hover:bg-muted/30 transition-colors flex-1"
                onClick={() => { document.querySelector<HTMLButtonElement>('[role="combobox"]')?.click() }}>
                <div className="text-center">
                    <BookUser className="h-16 w-16 text-accent mb-4 mx-auto" />
                    <p className="text-xl text-muted-foreground uppercase">PLEASE SELECT A PARTY</p>
                </div>
            </Card>
        )}
    </div>
  )
}
