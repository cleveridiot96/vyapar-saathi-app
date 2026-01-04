"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PlusCircle, SlidersHorizontal, Undo2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddAdjustmentForm } from './AddAdjustmentForm';
import { isDateInFinancialYear } from '@/lib/utils';
import { useTransactions, useMasters } from '@/hooks/useTransactions';
import { useToast } from "@/hooks/use-toast";
import type { StockAdjustment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function StockAdjustmentsClient() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  
  const {
      adjustments,
      purchases,
      locationTransfers,
      addAdjustment,
      isTransactionsLoaded,
  } = useTransactions();
  const { masterData, isMastersLoaded } = useMasters();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToReverse, setItemToReverse] = useState<StockAdjustment | null>(null);

  const allLotsInSystem = useMemo(() => {
    const lots = new Set<string>();
    (purchases || []).forEach(p => p.items.forEach(i => lots.add(i.lotNumber)));
    (locationTransfers || []).forEach(t => t.items.forEach(i => {
        lots.add(i.originalLotNumber);
        lots.add(i.newLotNumber);
    }));
    return Array.from(lots).sort();
  }, [purchases, locationTransfers]);

  const filteredAdjustments = useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return (adjustments || [])
      .filter(adj => isDateInFinancialYear(adj.date, financialYear))
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [adjustments, financialYear, isTransactionsLoaded]);

  const handleAddAdjustment = useCallback((newAdjustment: Omit<StockAdjustment, 'id'>) => {
    addAdjustment({ ...newAdjustment, id: `adj-${Date.now()}` });
    toast({ title: 'Adjustment Recorded', description: 'The stock adjustment has been successfully saved.' });
  }, [addAdjustment, toast]);

  const handleReverseAttempt = (adjustment: StockAdjustment) => {
    if (adjustment.type === 'Reversal') {
      toast({ title: 'Cannot Reverse', description: 'This is already a reversal transaction.', variant: 'destructive' });
      return;
    }
    setItemToReverse(adjustment);
  };

  const confirmReversal = () => {
    if (itemToReverse) {
      const reversal: Omit<StockAdjustment, 'id'> = {
        date: format(new Date(), 'yyyy-MM-dd'),
        lotNumber: itemToReverse.lotNumber,
        locationId: itemToReverse.locationId,
        locationName: itemToReverse.locationName,
        bags: -itemToReverse.bags,
        weight: -itemToReverse.weight,
        type: 'Reversal',
        reason: `Reversal of adjustment ID: ${itemToReverse.id}`,
      };
      handleAddAdjustment(reversal);
      setItemToReverse(null);
    }
  };

  const getBadgeVariant = (type: StockAdjustment['type']) => {
    switch (type) {
      case 'Wastage':
      case 'Theft':
        return 'destructive';
      case 'Correction':
        return 'secondary';
      case 'Reversal':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  if (!isTransactionsLoaded || !isMastersLoaded || isAppHydrating) {
      return (
          <div className="space-y-4 p-4">
              <div className="flex justify-between items-center">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-[calc(100vh-15rem)] w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <SlidersHorizontal /> Stock Adjustments
            </CardTitle>
            <CardDescription>Manually adjust stock levels for wastage, theft, or corrections.</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Adjustment
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[60vh] overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Bags</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24">No adjustments recorded for this financial year.</TableCell></TableRow>
                ) : (
                  filteredAdjustments.map(adj => (
                    <TableRow key={adj.id}>
                      <TableCell>{format(parseISO(adj.date), 'dd/MM/yy')}</TableCell>
                      <TableCell>{adj.lotNumber}</TableCell>
                      <TableCell>{adj.locationName}</TableCell>
                      <TableCell><Badge variant={getBadgeVariant(adj.type)}>{adj.type}</Badge></TableCell>
                      <TableCell className={`text-right font-medium ${adj.bags < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {adj.bags.toLocaleString('en-IN', { signDisplay: 'always' })}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${adj.weight < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {adj.weight.toLocaleString('en-IN', { signDisplay: 'always', minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{adj.reason}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleReverseAttempt(adj)} title="Reverse Transaction" disabled={adj.type === 'Reversal'}>
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddAdjustmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddAdjustment}
        warehouses={masterData.Warehouse || []}
        availableLots={allLotsInSystem}
      />
      
      {itemToReverse && (
        <AlertDialog open={!!itemToReverse} onOpenChange={(open) => !open && setItemToReverse(null)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse this Stock Adjustment?</AlertDialogTitle>
            <AlertDialogDescription>
                This will create a new, opposite adjustment transaction to cancel out the selected one. The original record will remain for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReversal}>Confirm Reversal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
      )}
    </div>
  );
}
