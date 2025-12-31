"use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { DaybookEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, ShoppingCart, Receipt as ReceiptIcon, ArrowRightCircle, ArrowLeftCircle, ArrowRightLeft, FileText, BookMarked } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { DataTableColumnHeader } from '@/components/shared/DataTableColumnHeader';
import type { ColumnDef, DateRange } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { useAppState } from '@/hooks/useAppState';
import { useHydrated } from '@/hooks/useHydrated';
import { DatePicker } from "@/components/shared/DatePicker";

const typeToIconMap: Record<DaybookEntry['type'], React.ElementType> = {
    Purchase: ShoppingCart,
    Sale: ReceiptIcon,
    Payment: ArrowRightCircle,
    Receipt: ArrowLeftCircle,
    Transfer: ArrowRightLeft,
    Expense: FileText,
};
const typeToColorMap: Record<DaybookEntry['type'], string> = {
    Purchase: 'text-purple-600',
    Sale: 'text-blue-600',
    Payment: 'text-red-600',
    Receipt: 'text-green-600',
    Transfer: 'text-cyan-600',
    Expense: 'text-orange-600',
};

const typeToRowClassMap: Record<DaybookEntry['type'], string> = {
    Purchase: 'bg-purple-50/50 hover:bg-purple-50/80',
    Sale: 'bg-blue-50/50 hover:bg-blue-50/80',
    Payment: 'bg-red-50/50 hover:bg-red-50/80',
    Receipt: 'bg-green-50/50 hover:bg-green-50/80',
    Transfer: 'bg-cyan-50/50 hover:bg-cyan-50/80',
    Expense: 'bg-orange-50/50 hover:bg-orange-50/80',
}


export function DaybookClient() {
  const isHydrated = useHydrated();
  const router = useRouter();

  // Data states from central hook
  const { purchases, sales, receipts, payments, locationTransfers, ledger: ledgerData, isLoaded } = useAppState();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
  });

  const allDaybookEntries = useMemo((): DaybookEntry[] => {
    if (!isLoaded || !dateRange?.from) return [];
    
    const entries: DaybookEntry[] = [];
    const toDate = dateRange.to || dateRange.from;

    const filterByDate = (date: string) => isWithinInterval(parseISO(date), { start: startOfDay(dateRange.from!), end: endOfDay(toDate) });

    purchases.filter(p => filterByDate(p.date)).forEach(p => entries.push({
      id: `pur-${p.id}`, date: p.date, type: 'Purchase', voucherNo: p.id.slice(-6).toUpperCase(),
      party: p.supplierName || 'UNKNOWN', debit: p.totalAmount, credit: 0,
      narration: `PURCHASE OF ${p.items.map(i=>i.lotNumber).join(', ')}`, href: `/purchases#${p.id}`,
      Icon: typeToIconMap['Purchase'], colorClass: typeToColorMap['Purchase'],
    }));

    sales.filter(s => filterByDate(s.date)).forEach(s => entries.push({
      id: `sal-${s.id}`, date: s.date, type: 'Sale', voucherNo: s.billNumber || s.id.slice(-6).toUpperCase(),
      party: s.customerName || 'UNKNOWN', debit: 0, credit: s.billedAmount,
      narration: `SALE OF ${s.items.map(i=>i.lotNumber).join(', ')}`, href: `/sales#${s.id}`,
      Icon: typeToIconMap['Sale'], colorClass: typeToColorMap['Sale'],
    }));

    payments.filter(p => filterByDate(p.date)).forEach(p => entries.push({
      id: `pay-${p.id}`, date: p.date, type: 'Payment', voucherNo: p.id.slice(-6).toUpperCase(),
      party: p.partyName || 'UNKNOWN', debit: 0, credit: p.amount,
      narration: `PAYMENT VIA ${p.paymentMethod || 'CASH'}`, href: `/payments#${p.id}`,
      Icon: typeToIconMap['Payment'], colorClass: typeToColorMap['Payment'],
    }));

    receipts.filter(r => filterByDate(r.date)).forEach(r => entries.push({
      id: `rec-${r.id}`, date: r.date, type: 'Receipt', voucherNo: r.id.slice(-6).toUpperCase(),
      party: r.partyName || 'UNKNOWN', debit: r.amount, credit: 0,
      narration: `RECEIPT VIA ${r.paymentMethod}`, href: `/receipts#${r.id}`,
      Icon: typeToIconMap['Receipt'], colorClass: typeToColorMap['Receipt'],
    }));

    locationTransfers.filter(t => filterByDate(t.date)).forEach(t => entries.push({
      id: `trn-${t.id}`, date: t.date, type: 'Transfer', voucherNo: t.id.slice(-6).toUpperCase(),
      party: 'INTERNAL TRANSFER', debit: 0, credit: 0,
      narration: `FROM ${t.fromLocationName} TO ${t.toLocationName}`, href: `/location-transfer#${t.id}`,
      Icon: typeToIconMap['Transfer'], colorClass: typeToColorMap['Transfer'],
    }));
    
    ledgerData.filter(l => l.type === 'Expense' && filterByDate(l.date)).forEach(l => {
        let href = '/payments'; // Default fallback
        if(l.linkedTo?.voucherId) {
            if(l.linkedTo?.voucherType === 'Purchase') href = `/purchases#${l.linkedTo.voucherId}`;
            else if (l.linkedTo?.voucherType === 'Sale') href = `/sales#${l.linkedTo.voucherId}`;
            else if (l.linkedTo?.voucherType === 'Transfer') href = `/location-transfer#${l.linkedTo.voucherId}`;
        }
        
        entries.push({
            id: `exp-${l.id}`, date: l.date, type: 'Expense', voucherNo: l.relatedVoucher?.slice(-6).toUpperCase() || 'N/A',
            party: l.party || 'SELF', debit: l.debit, credit: l.credit,
            narration: `EXPENSE: ${l.account}`, href: href,
            Icon: typeToIconMap['Expense'], colorClass: typeToColorMap['Expense'],
        });
    });

    return entries.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [isLoaded, purchases, sales, payments, receipts, locationTransfers, ledgerData, dateRange]);
  
  const columns: ColumnDef<DaybookEntry>[] = useMemo(() => [
    {
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="DATE" />,
        cell: ({ row }) => format(parseISO(row.original.date), 'dd/MM/yy'),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="TYPE" />,
        cell: ({ row }) => (
            <Badge variant="outline" className={cn("border-current", row.original.colorClass)}>
                <row.original.Icon className={cn("mr-1.5 h-3.5 w-3.5", row.original.colorClass)}/>
                {row.original.type}
            </Badge>
        ),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'voucherNo',
        header: ({ column }) => <DataTableColumnHeader column={column} title="VOUCHER NO." />,
    },
    {
        accessorKey: 'party',
        header: ({ column }) => <DataTableColumnHeader column={column} title="PARTY" />,
    },
    {
        accessorKey: 'debit',
        header: ({ column }) => <DataTableColumnHeader column={column} title="DEBIT (₹)" className="justify-end" />,
        cell: ({ row }) => (
            <div className="text-right font-mono">
                {row.original.debit > 0 ? row.original.debit.toLocaleString('en-IN') : '-'}
            </div>
        )
    },
    {
        accessorKey: 'credit',
        header: ({ column }) => <DataTableColumnHeader column={column} title="CREDIT (₹)" className="justify-end" />,
        cell: ({ row }) => (
            <div className="text-right font-mono">
                {row.original.credit > 0 ? row.original.credit.toLocaleString('en-IN') : '-'}
            </div>
        )
    },
    {
        accessorKey: 'narration',
        header: "NARRATION",
        cell: ({ row }) => <div className="whitespace-normal break-words">{row.original.narration}</div>
    }
  ], []);

  if (!isLoaded || !isHydrated) {
      return <div>Loading Daybook...</div>;
  }

  return (
    <div className="space-y-2 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-4" />
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                    <BookMarked className="h-7 w-7 text-primary"/> DAYBOOK / JOURNAL
                </CardTitle>
                <CardDescription>A CHRONOLOGICAL VIEW OF ALL BUSINESS TRANSACTIONS.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <DatePicker mode="range" date={dateRange} onDateChange={setDateRange} />
                <Button variant="outline" size="icon" onClick={() => window.print()} className="no-print"><Printer className="h-5 w-5"/></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <DataTable
                columns={columns}
                data={allDaybookEntries}
                onRowClick={(row) => row.original.href && router.push(row.original.href)}
                getRowId={(row) => row.id}
                initialState={{
                    sorting: [{ id: 'date', desc: true }]
                }}
                getRowClassName={(row) => typeToRowClassMap[row.original.type]}
            />
        </CardContent>
      </Card>
    </div>
  )
}
