"use client";

import * as React from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInventory } from '@/hooks/useInventory';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, Printer, RotateCcw, GitMerge, FileText } from "lucide-react";
import { AddLocationTransferForm } from "./AddLocationTransferForm";
import { LocationTransferSlipPrint } from "./LocationTransferSlipPrint";
import type { LocationTransfer } from "@/lib/types";
import { renderToStaticMarkup } from 'react-dom/server';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { isDateInFinancialYear } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useHydrated } from "@/hooks/useHydrated";

export function LocationTransferClient() {
  const { 
    locationTransfers, 
    setLocationTransfers, 
    addLedgerEntry, 
    removeLedgerEntries, 
    masterData, 
    isLoaded 
  } = useTransactions();
  
  const { toast } = useToast();
  const { financialYear } = useSettings();
  const isHydrated = useHydrated();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transferToEdit, setTransferToEdit] = useState<LocationTransfer | null>(null);
  const [itemToDelete, setItemToDelete] = useState<LocationTransfer | null>(null);

  const openPrintWindow = (htmlContent: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePrint = (transfer: LocationTransfer) => {
    const slipContent = renderToStaticMarkup(<LocationTransferSlipPrint transfer={transfer} />);
    const slipHtml = `<html><head><title>Transfer Slip</title><style>.print-chitti-styles { font-family: sans-serif; line-height: 1.4; width: 550px; margin: auto; } h1, h2 { margin: 0.5em 0; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 4px; } .text-right { text-align: right; } .font-bold { font-weight: bold; } .mt-4 { margin-top: 1rem; } .mb-2 { margin-bottom: 0.5rem; } .flex-between { display: flex; justify-content: space-between; }</style></head><body>${slipContent}</body></html>`;
    openPrintWindow(slipHtml);
  };
  
  const handleAddOrUpdateTransfer = (transfer: LocationTransfer) => {
    setLocationTransfers(prev => {
      const existing = prev.find(t => t.id === transfer.id);
      if (existing) {
        // Remove old ledger entries before adding new ones
        removeLedgerEntries(existing.id);
      }
      const newTransfers = existing 
        ? prev.map(t => t.id === transfer.id ? transfer : t) 
        : [transfer, ...prev];

      // Add new ledger entries
      if (transfer.expenses) {
        const newLedgerEntries = transfer.expenses.map(exp => ({
          id: `ledger-${exp.id}-${transfer.id}`,
          date: transfer.date,
          type: 'Expense' as const,
          account: exp.account,
          debit: exp.amount,
          credit: 0,
          paymentMode: exp.paymentMode,
          party: exp.partyName || 'N/A',
          partyId: exp.partyId,
          relatedVoucher: transfer.id,
          linkedTo: { voucherType: 'Transfer' as const, voucherId: transfer.id },
          remarks: `Transfer from ${transfer.fromLocationName} to ${transfer.toLocationName}`,
        }));
        addLedgerEntry(newLedgerEntries);
      }

      return newTransfers;
    });
    toast({ title: transferToEdit ? 'Transfer Updated' : 'Transfer Created' });
    setIsFormOpen(false);
    setTransferToEdit(null);
  };

  const handleEditTransfer = (transfer: LocationTransfer) => {
    setTransferToEdit(transfer);
    setIsFormOpen(true);
  };

  const handleDeleteTransferAttempt = (transfer: LocationTransfer) => {
    setItemToDelete(transfer);
  };

  const confirmDeleteTransfer = () => {
    if (itemToDelete) {
      setLocationTransfers(prev => prev.filter(t => t.id !== itemToDelete.id));
      removeLedgerEntries(itemToDelete.id);
      toast({ title: 'Transfer Deleted', variant: 'destructive' });
      setItemToDelete(null);
    }
  };
  
  const filteredTransfers = React.useMemo(() => {
    if (!isLoaded || !isHydrated) return [];
    return locationTransfers.filter(lt => isDateInFinancialYear(lt.date, financialYear))
      .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [locationTransfers, financialYear, isLoaded, isHydrated]);


  if (!isLoaded || !isHydrated) {
      return (
          <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
              <p className="text-lg text-muted-foreground">Loading transfer data...</p>
          </div>
      );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2"><Truck/> Location Transfers</CardTitle>
              <CardDescription>Move stock between your warehouses.</CardDescription>
            </div>
            <Button onClick={() => { setTransferToEdit(null); setIsFormOpen(true); }} size="lg">
                <PlusCircle className="mr-2"/> New Transfer
            </Button>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[65vh] border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Lots Transferred</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransfers.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground">No transfers recorded yet.</TableCell></TableRow>
                        ) : (
                            filteredTransfers.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{format(parseISO(t.date), 'dd-MM-yyyy')}</TableCell>
                                    <TableCell>{t.fromLocationName}</TableCell>
                                    <TableCell>{t.toLocationName}</TableCell>
                                    <TableCell>{t.items.map(i => i.newLotNumber).join(', ')}</TableCell>
                                    <TableCell className="text-right font-medium">₹{t.totalTransferCost.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" onClick={() => handlePrint(t)}><Printer className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditTransfer(t)}><FileText className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
      </Card>
      
      {isFormOpen && (
        <AddLocationTransferForm
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setTransferToEdit(null); }}
          transferToEdit={transferToEdit}
        />
      )}

      {itemToDelete && (
         <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete transfer record {itemToDelete.id.slice(-6).toUpperCase()}.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTransfer} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      )}
    </div>
  );
}
