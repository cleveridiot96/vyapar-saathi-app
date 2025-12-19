"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MasterDataCombobox } from '@/components/shared/MasterDataCombobox';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { LocationTransfer, MasterItem, AggregatedInventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface MergeLotsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<LocationTransfer, 'id' | 'date'>) => void;
  warehouses: MasterItem[];
  availableStock: AggregatedInventoryItem[];
}

const mergeSchema = z.object({
  fromLocationId: z.string().min(1, 'Source warehouse is required'),
  toLocationId: z.string().min(1, 'Destination warehouse is required'),
  newLotNumber: z.string().min(1, 'New lot number is required'),
  lotsToMerge: z.array(z.object({
    lotNumber: z.string().min(1, 'Please select a lot')
  })).min(2, 'Please select at least two lots to merge'),
  notes: z.string().optional(),
});

type MergeFormValues = z.infer<typeof mergeSchema>;

export const MergeLotsForm: React.FC<MergeLotsFormProps> = ({ isOpen, onClose, onSubmit, warehouses, availableStock }) => {
  const { toast } = useToast();
  const form = useForm<MergeFormValues>({
    resolver: zodResolver(mergeSchema),
    defaultValues: {
      fromLocationId: '',
      toLocationId: '',
      newLotNumber: '',
      lotsToMerge: [{ lotNumber: '' }, { lotNumber: '' }],
    },
  });
  
  const fromLocationId = form.watch('fromLocationId');
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lotsToMerge"
  });

  const stockOptions = React.useMemo(() => {
    return availableStock
      .filter(s => s.locationId === fromLocationId)
      .map(s => ({ value: s.lotNumber, label: `${s.lotNumber} (${s.currentBags} bags)` }));
  }, [availableStock, fromLocationId]);

  const handleSubmit = (values: MergeFormValues) => {
    const lots = values.lotsToMerge.map(l => l.lotNumber);
    const uniqueLots = new Set(lots);
    if (uniqueLots.size !== lots.length) {
      toast({ title: 'Duplicate lots selected', variant: 'destructive' });
      return;
    }

    const itemsToTransfer = lots.map(lotNumber => {
      const stockItem = availableStock.find(s => s.lotNumber === lotNumber && s.locationId === values.fromLocationId);
      if (!stockItem) throw new Error(`Stock for ${lotNumber} not found.`);
      return {
        id: `transfer-item-${lotNumber}`,
        originalLotNumber: lotNumber,
        newLotNumber: values.newLotNumber,
        quantity: stockItem.currentBags,
        netWeight: stockItem.currentWeight,
        costOfGoods: stockItem.cogs,
      };
    });

    const transferData: Omit<LocationTransfer, 'id' | 'date'> = {
      fromLocationId: values.fromLocationId,
      fromLocationName: warehouses.find(w => w.id === values.fromLocationId)?.name || 'N/A',
      toLocationId: values.toLocationId,
      toLocationName: warehouses.find(w => w.id === values.toLocationId)?.name || 'N/A',
      items: itemsToTransfer,
      totalTransferCost: 0,
      notes: `Merged lots: ${lots.join(', ')} into ${values.newLotNumber}. ${values.notes || ''}`,
    };

    onSubmit(transferData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Lots</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Warehouse</FormLabel>
                    <MasterDataCombobox options={(warehouses || []).map(w => ({ value: w.id, label: w.name }))} placeholder="Select source" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Warehouse</FormLabel>
                     <MasterDataCombobox options={(warehouses || []).map(w => ({ value: w.id, label: w.name }))} placeholder="Select destination" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="newLotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Merged Lot Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MERGED-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Lots to Merge</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`lotsToMerge.${index}.lotNumber`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <MasterDataCombobox options={stockOptions} placeholder="Select lot to merge" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               <Button type="button" variant="outline" size="sm" onClick={() => append({ lotNumber: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Lot
              </Button>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Merge Lots</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
