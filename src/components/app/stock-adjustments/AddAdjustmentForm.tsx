"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MasterDataCombobox } from '@/components/shared/MasterDataCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { StockAdjustment, MasterItem } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker } from '@/components/shared/DatePicker';

const adjustmentSchema = z.object({
  date: z.date({ required_error: "Adjustment date is required." }),
  lotNumber: z.string().min(1, "Lot number is required."),
  locationId: z.string().min(1, "Location is required."),
  type: z.enum(['Correction', 'Wastage', 'Theft', 'Initial Stock', 'Reversal'], { required_error: "Adjustment type is required." }),
  bags: z.coerce.number().int("Bags must be a whole number.").default(0),
  weight: z.coerce.number().default(0),
  reason: z.string().optional(),
}).refine(data => data.bags !== 0 || data.weight !== 0, {
  message: "At least one of Bags or Weight must be non-zero.",
  path: ["bags"],
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface AddAdjustmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<StockAdjustment, 'id'>) => void;
  warehouses: MasterItem[];
  availableLots: string[];
}

export function AddAdjustmentForm({ isOpen, onClose, onSubmit, warehouses, availableLots }: AddAdjustmentFormProps) {
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { date: new Date(), bags: 0, weight: 0 },
  });
  const watchedType = form.watch("type");

  const processSubmit = (values: AdjustmentFormValues) => {
    let bags = values.bags;
    let weight = values.weight;

    if (watchedType === 'Wastage' || watchedType === 'Theft') {
      bags = -Math.abs(bags);
      weight = -Math.abs(weight);
    }

    const location = warehouses.find(w => w.id === values.locationId);

    onSubmit({
      date: format(values.date, 'yyyy-MM-dd'),
      lotNumber: values.lotNumber,
      locationId: values.locationId,
      locationName: location?.name || values.locationId,
      bags,
      weight,
      type: values.type,
      reason: values.reason,
    });
    form.reset({ date: new Date(), bags: 0, weight: 0 });
    onClose();
  };

  const lotOptions = availableLots.map(lot => ({ value: lot, label: lot }));
  const warehouseOptions = warehouses.map(wh => ({ value: wh.id, label: wh.name }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Stock Adjustment</DialogTitle>
          <DialogDescription>
            Record a manual change to stock levels. Use positive numbers for additions and negative numbers for reductions in 'Correction' mode.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Adjustment Date</FormLabel>
                  <DatePicker mode="single" date={field.value} onDateChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Correction">Correction (Add/Remove)</SelectItem>
                      <SelectItem value="Wastage">Wastage (Remove)</SelectItem>
                      <SelectItem value="Theft">Theft (Remove)</SelectItem>
                      <SelectItem value="Initial Stock">Initial Stock (Add)</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="lotNumber" render={({ field }) => (
                <FormItem><FormLabel>Lot Number</FormLabel>
                  <MasterDataCombobox value={field.value} onChange={field.onChange} options={lotOptions} placeholder="Select Lot" searchPlaceholder="Search Lots..." />
                  <FormMessage />
                </FormItem>)} />
              <FormField control={form.control} name="locationId" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel>
                  <MasterDataCombobox value={field.value} onChange={field.onChange} options={warehouseOptions} placeholder="Select Location" />
                  <FormMessage />
                </FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="bags" render={({ field }) => (
                <FormItem><FormLabel>Bags {watchedType !== 'Correction' && watchedType !== 'Initial Stock' ? '(Qty to Remove)' : '(+/-)'}</FormLabel>
                  <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>)} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>Weight (kg) {watchedType !== 'Correction' && watchedType !== 'Initial Stock' ? '(Qty to Remove)' : '(+/-)'}</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>)} />
            </div>
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem><FormLabel>Reason / Notes</FormLabel>
                <FormControl><Textarea placeholder="Explain the reason for this adjustment..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>)} />
          </form>
        </Form>
        </ScrollArea>
        <DialogFooter className="border-t pt-4 mt-4">
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={form.handleSubmit(processSubmit)}>Save Adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
