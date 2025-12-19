"use client";

import * as React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MasterDataCombobox } from '@/components/shared/MasterDataCombobox';
import { useToast } from '@/hooks/use-toast';
import type { Warehouse, LocationTransfer, LocationTransferItem } from '@/lib/types';
import type { AggregatedInventoryItem } from '@/hooks/useInventory';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';

const mergeLotsSchema = (availableStock: AggregatedInventoryItem[]) => z.object({
  warehouseId: z.string().min(1, "Warehouse selection is required."),
  lotsToMerge: z.array(z.string()).min(2, "Please select at least two lots to merge."),
  newLotNumber: z.string().min(1, "New lot number is required.").refine(
    (val) => !availableStock.some(s => s.lotNumber.toUpperCase() === val.toUpperCase()),
    { message: "This lot number already exists." }
  ),
});

type MergeLotsFormValues = z.infer<ReturnType<typeof mergeLotsSchema>>;

interface MergeLotsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<LocationTransfer, 'id' | 'date'>) => void;
  warehouses: Warehouse[];
  availableStock: AggregatedInventoryItem[];
}

export function MergeLotsForm({ isOpen, onClose, onSubmit, warehouses, availableStock }: MergeLotsFormProps) {
  const { toast } = useToast();
  const form = useForm<MergeLotsFormValues>({
    resolver: zodResolver(mergeLotsSchema(availableStock)),
    defaultValues: { warehouseId: undefined, lotsToMerge: [], newLotNumber: "" },
  });

  const watchedWarehouseId = form.watch("warehouseId");
  const watchedLotsToMerge = form.watch("lotsToMerge");

  const lotsInWarehouse = React.useMemo(() => {
    if (!watchedWarehouseId) return [];
    return availableStock.filter(s => s.locationId === watchedWarehouseId && s.currentBags > 0);
  }, [availableStock, watchedWarehouseId]);

  const mergeSummary = React.useMemo(() => {
    const selectedLots = availableStock.filter(s => watchedLotsToMerge.includes(s.key));
    if (selectedLots.length === 0) {
      return { totalBags: 0, totalWeight: 0, newLandedCost: 0, totalCostOfGoods: 0 };
    }

    const totalWeight = selectedLots.reduce((sum, lot) => sum + lot.currentWeight, 0);
    const totalCost = selectedLots.reduce((sum, lot) => sum + (lot.currentWeight * lot.effectiveRate), 0);
    const totalBags = selectedLots.reduce((sum, lot) => sum + lot.currentBags, 0);

    return {
      totalBags,
      totalWeight,
      newLandedCost: totalWeight > 0 ? totalCost / totalWeight : 0,
      totalCostOfGoods: totalCost,
    };
  }, [availableStock, watchedLotsToMerge]);

  const handleLotToggle = (lotKey: string) => {
    const currentSelection = form.getValues("lotsToMerge");
    const newSelection = currentSelection.includes(lotKey)
      ? currentSelection.filter(key => key !== lotKey)
      : [...currentSelection, lotKey];
    form.setValue("lotsToMerge", newSelection, { shouldValidate: true });
  };
  
  React.useEffect(() => {
    form.setValue("lotsToMerge", []);
  }, [watchedWarehouseId, form]);

  const processSubmit = (values: MergeLotsFormValues) => {
    const selectedLotsData = availableStock.filter(s => values.lotsToMerge.includes(s.key));
    
    const transferItems: LocationTransferItem[] = selectedLotsData.map(lot => ({
      id: `transfer-item-${lot.lotNumber}-${Date.now()}`,
      originalLotNumber: lot.lotNumber,
      newLotNumber: values.newLotNumber,
      quantity: lot.currentBags,
      netWeight: lot.currentWeight,
      costOfGoods: lot.currentWeight * lot.effectiveRate,
    }));
    
    const warehouse = warehouses.find(w => w.id === values.warehouseId);

    const transferData: Omit<LocationTransfer, 'id' | 'date'> = {
      fromLocationId: values.warehouseId,
      fromLocationName: warehouse?.name || 'N/A',
      toLocationId: values.warehouseId,
      toLocationName: warehouse?.name || 'N/A',
      items: transferItems,
      totalTransferCost: 0, 
      notes: `MERGE OF ${selectedLotsData.length} LOTS INTO ${values.newLotNumber}`,
    };
    
    onSubmit(transferData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Merge Stock Lots</DialogTitle>
          <DialogDescription>
            Combine multiple existing stock lots from the same warehouse into a single new lot. The system will calculate the new weighted average cost.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <MasterDataCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={(warehouses || []).map(w => ({ value: w.id, label: w.name }))}
                      placeholder="Select Warehouse"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="newLotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Merged Lot Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., MERGED-LOT-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lotsToMerge"
              render={() => (
                <FormItem>
                  <FormLabel>Select Lots to Merge</FormLabel>
                  <ScrollArea className="h-64 border rounded-md p-2">
                    {lotsInWarehouse.length === 0 ? (
                        <p className="text-center text-muted-foreground p-4">Select a warehouse to see available lots.</p>
                    ) : (
                        lotsInWarehouse.map(lot => (
                            <div key={lot.key} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={lot.key}
                                    checked={watchedLotsToMerge.includes(lot.key)}
                                    onCheckedChange={() => handleLotToggle(lot.key)}
                                />
                                <label htmlFor={lot.key} className="flex-grow grid grid-cols-4 gap-2 text-sm cursor-pointer">
                                    <span className="font-medium col-span-2">{lot.lotNumber}</span>
                                    <span className="text-right">{Math.round(lot.currentBags)} bags</span>
                                    <span className="text-right">{lot.currentWeight.toFixed(2)} kg</span>
                                </label>
                            </div>
                        ))
                    )}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedLotsToMerge.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold text-lg mb-2">Merge Summary</h3>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Total Bags:</TableCell><TableCell className="text-right font-bold">{Math.round(mergeSummary.totalBags).toLocaleString()}</TableCell></TableRow>
                    <TableRow><TableCell>Total Weight:</TableCell><TableCell className="text-right font-bold">{mergeSummary.totalWeight.toLocaleString(undefined, {minimumFractionDigits:2})} kg</TableCell></TableRow>
                    <TableRow className="text-primary"><TableCell>New Weighted Avg Cost:</TableCell><TableCell className="text-right font-bold">₹{mergeSummary.newLandedCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} / kg</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </form>
        </FormProvider>
        </ScrollArea>
        <DialogFooter className="border-t pt-4 mt-4">
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={form.handleSubmit(processSubmit)}>Confirm Merge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
