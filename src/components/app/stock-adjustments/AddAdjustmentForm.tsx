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

interface AddAdjustmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<StockAdjustment, 'id'>) => void;
  warehouses: MasterItem[];
  availableLots: string[];
}

const adjustmentSchema = z.object({
  date: z.string().min(1, "Date is required."),
  lotNumber: z.string().min(1, "Lot number is required."),
  locationId: z.string().min(1, "Location is required."),
  bags: z.coerce.number(),
  weight: z.coerce.number(),
  type: z.enum(['Correction', 'Wastage', 'Theft', 'Initial Stock', 'Reversal']),
  reason: z.string().min(1, "Reason is required."),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export const AddAdjustmentForm: React.FC<AddAdjustmentFormProps> = ({ isOpen, onClose, onSubmit, warehouses, availableLots }) => {
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      bags: 0,
      weight: 0,
      type: 'Correction',
    },
  });

  const handleSubmit = (values: AdjustmentFormValues) => {
    const warehouse = warehouses.find(w => w.id === values.locationId);
    onSubmit({
      ...values,
      locationName: warehouse?.name || 'Unknown',
    });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Stock Adjustment</DialogTitle>
          <DialogDescription>Manually adjust stock levels for a specific lot.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Correction">Correction</SelectItem>
                        <SelectItem value="Wastage">Wastage</SelectItem>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                        <SelectItem value="Reversal">Reversal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="lotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Number</FormLabel>
                    <MasterDataCombobox options={(availableLots || []).map(l => ({value: l, label: l}))} placeholder="Select lot" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <MasterDataCombobox options={(warehouses || []).map(w => ({value: w.id, label: w.name}))} placeholder="Select warehouse" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="bags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bags Adjustment</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., -5 or 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) Adjustment</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., -250.5 or 500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe why this adjustment is being made..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Save Adjustment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
