"use client";

import * as React from "react";
import type { Payment, Receipt, MasterItem, Sale, Purchase } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker } from "@/components/shared/DatePicker";
import type { DateRange } from "react-day-picker";
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { BookOpen, PlusCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransactions, useMasters } from "@/hooks/useTransactions";
import { useOutstandingBalances } from "@/hooks/useOutstandingBalances";
import dynamic from 'next/dynamic';

const AddPaymentForm = dynamic(() => import('../payments/AddPaymentForm').then(mod => mod.AddPaymentForm), { ssr: false });
const AddReceiptForm = dynamic(() => import('../receipts/AddReceiptForm').then(mod => mod.AddReceiptForm), { ssr: false });


const CASH_OPENING_BALANCE_KEY = 'cashbookBaseOpeningBalance';

interface CashLedgerTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Receipt' | 'Payment';
  particulars: string;
  debit: number; // Inflow
  credit: number; // Outflow
  balance: number;
}

export function CashbookClient() {
  const { toast } = useToast();
  const { 
    payments, 
    receipts, 
    purchases, 
    sales, 
    isTransactionsLoaded,
    addPayment,
    updatePayment,
    addReceipt,
    updateReceipt,
  } = useTransactions();
  const { addOrUpdateMaster } = useMasters();
  const { receivableParties, payableParties } = useOutstandingBalances();


  const [baseOpeningBalance, setBaseOpeningBalance] = React.useState<number>(0);
  const [tempOpeningBalance, setTempOpeningBalance] = React.useState('0');

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  const [isAddPaymentFormOpen, setIsAddPaymentFormOpen] = React.useState(false);
  const [isAddReceiptFormOpen, setIsAddReceiptFormOpen] = React.useState(false);
  const [paymentToEdit, setPaymentToEdit] = React.useState<Payment | null>(null);
  const [receiptToEdit, setReceiptToEdit] = React.useState<Receipt | null>(null);

  React.useEffect(() => {
    const savedBalance = localStorage.getItem(CASH_OPENING_BALANCE_KEY);
    const balance = savedBalance ? parseFloat(savedBalance) : 0;
    setBaseOpeningBalance(balance);
    setTempOpeningBalance(String(balance));
  }, []); 

  const handleSaveOpeningBalance = () => {
    const newBalance = parseFloat(tempOpeningBalance);
    if (!isNaN(newBalance)) {
        setBaseOpeningBalance(newBalance);
        localStorage.setItem(CASH_OPENING_BALANCE_KEY, String(newBalance));
        toast({ title: 'Base opening balance saved.' });
    } else {
        toast({ title: 'Invalid number', description: 'Please enter a valid number for the opening balance.', variant: 'destructive' });
        setTempOpeningBalance(String(baseOpeningBalance)); // Revert to old value on error
    }
  };

  const cashLedgerData = React.useMemo(() => {
    if (!isTransactionsLoaded || !dateRange?.from) return { entries: [], openingBalance: 0, closingBalance: 0 };
    
    let calculatedOpeningBalance = baseOpeningBalance;

    const cashReceipts = receipts.filter(r => r.paymentMethod === 'Cash');
    const cashPayments = payments.filter(p => p.paymentMethod === 'Cash');

    cashReceipts.forEach(tx => {
      if (parseISO(tx.date) < startOfDay(dateRange.from!)) {
        calculatedOpeningBalance += tx.amount;
      }
    });
    cashPayments.forEach(tx => {
      if (parseISO(tx.date) < startOfDay(dateRange.from!)) {
        calculatedOpeningBalance -= tx.amount;
      }
    });
    
    const periodReceipts = cashReceipts.filter(tx => isWithinInterval(parseISO(tx.date), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from!) }));
    const periodPayments = cashPayments.filter(tx => isWithinInterval(parseISO(tx.date), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from!) }));

    const combined = [
      ...periodReceipts.map(r => ({ ...r, txType: 'Receipt' as const })),
      ...periodPayments.map(p => ({ ...p, txType: 'Payment' as const }))
    ].sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());


    let runningBalance = calculatedOpeningBalance;
    const entries: CashLedgerTransaction[] = combined.map(tx => {
        const debit = tx.txType === 'Receipt' ? tx.amount : 0;
        const credit = tx.txType === 'Payment' ? tx.amount : 0;
        runningBalance = runningBalance + debit - credit;
        
        const particularDetails = `${tx.txType === 'Receipt' ? 'From' : 'To'} ${tx.partyName || tx.partyId} (${tx.partyType})` +
                                  (tx.source ? ` (Src: ${tx.source})` : '');
        return {
            id: `${tx.txType}-${tx.id}`,
            date: tx.date,
            type: tx.txType,
            particulars: particularDetails,
            debit,
            credit,
            balance: runningBalance,
        };
    });

    return { entries, openingBalance: calculatedOpeningBalance, closingBalance: runningBalance };
  }, [payments, receipts, isTransactionsLoaded, dateRange, baseOpeningBalance]);


  const handleAddPaymentFromCashbook = React.useCallback((payment: Payment) => {
    if(payments.some(p => p.id === payment.id)) {
        updatePayment(payment);
    } else {
        addPayment(payment);
    }
    toast({ title: "Success!", description: "Payment added to cashbook and payments." });
  }, [payments, addPayment, updatePayment, toast]);

  const handleAddReceiptFromCashbook = React.useCallback((receipt: Receipt) => {
    if(receipts.some(r => r.id === receipt.id)) {
        updateReceipt(receipt);
    } else {
        addReceipt(receipt);
    }
    toast({ title: "Success!", description: "Receipt added to cashbook and receipts." });
  }, [receipts, addReceipt, updateReceipt, toast]);

  const handleMasterDataUpdateFromCashbook = React.useCallback((item: MasterItem) => {
    addOrUpdateMaster(item);
    toast({title: "Info", description: `Master type ${item.type} updated.`});
  }, [addOrUpdateMaster, toast]);

  if (!isTransactionsLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground">Loading cashbook data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-4" />
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-2xl text-primary flex items-center">
              <BookOpen className="mr-3 h-7 w-7"/>Cash Book
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto no-print">
              <Button variant="outline" size="sm" onClick={() => { setPaymentToEdit(null); setIsAddPaymentFormOpen(true); }} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Payment
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setReceiptToEdit(null); setIsAddReceiptFormOpen(true); }} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Receipt
              </Button>
            </div>
          </div>
          <div className="w-full border-t pt-4 mt-4 flex justify-end items-center gap-2 no-print">
            <Label htmlFor="opening-balance-input" className="text-sm font-medium whitespace-nowrap">Base Opening Balance (₹):</Label>
            <Input
                id="opening-balance-input"
                type="number"
                step="0.01"
                className="w-40 h-9"
                value={tempOpeningBalance}
                onChange={(e) => setTempOpeningBalance(e.target.value)}
                onBlur={handleSaveOpeningBalance}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSaveOpeningBalance();
                        (e.target as HTMLInputElement).blur();
                    }
                }}
            />
        </div>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 no-print flex-wrap">
            <DatePicker mode="range" date={dateRange} onDateChange={setDateRange} />
            <Button variant="outline" size="icon" onClick={() => window.print()}>
              <Printer className="h-5 w-5" />
              <span className="sr-only">Print</span>
            </Button>
          </div>

          <div className="mb-4 p-3 border rounded-md bg-muted/50">
            <div className="flex justify-between text-sm font-medium">
                <span>Opening Balance for Period:</span>
                <span>{cashLedgerData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <ScrollArea className="h-[60vh] rounded-md border print:h-auto print:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right">Debit (In)</TableHead>
                  <TableHead className="text-right">Credit (Out)</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashLedgerData.entries.length === 0 ? (
                     <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No cash transactions in the selected period.</TableCell></TableRow>
                ) : (
                  cashLedgerData.entries.map((tx) => (
                    <TableRow key={tx.id} className={cn(tx.type === 'Receipt' ? 'bg-green-50/50' : 'bg-red-50/50')}>
                      <TableCell>{format(parseISO(tx.date), "dd/MM/yy")}</TableCell>
                      <TableCell className="uppercase">{tx.particulars}</TableCell>
                      <TableCell className="text-right font-mono text-green-700">
                        {tx.debit > 0 ? tx.debit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {tx.credit > 0 ? tx.credit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono">{tx.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="mt-4 pt-4 border-t">
            <div className="w-full flex justify-between text-lg font-bold text-primary">
                <span>Closing Balance for Period:</span>
                <span>{cashLedgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </CardFooter>
      </Card>

      {isAddPaymentFormOpen && (
        <AddPaymentForm
          isOpen={isAddPaymentFormOpen}
          onClose={() => setIsAddPaymentFormOpen(false)}
          onSubmit={handleAddPaymentFromCashbook}
          parties={payableParties}
          onMasterDataUpdate={handleMasterDataUpdateFromCashbook}
          paymentToEdit={paymentToEdit}
          allPurchases={purchases} 
          allPayments={payments}
        />
      )}

      {isAddReceiptFormOpen && (
        <AddReceiptForm
          isOpen={isAddReceiptFormOpen}
          onClose={() => setIsAddReceiptFormOpen(false)}
          onSubmit={handleAddReceiptFromCashbook}
          parties={receivableParties}
          onMasterDataUpdate={handleMasterDataUpdateFromCashbook}
          receiptToEdit={receiptToEdit}
          allSales={sales}
          allReceipts={receipts}
        />
      )}
    </div>
  );
}
