"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { MasterItem, MasterItemType, Agent, Broker } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MASTER_TYPES_CONFIG } from "@/lib/constants";

interface MasterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: MasterItem) => void;
  itemTypeFromButton: MasterItemType;
  initialData?: MasterItem | null;
  fixedIds?: string[];
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.custom<MasterItemType>(),
  commission: z.coerce.number().optional(),
  commissionType: z.enum(['Percentage', 'Fixed']).optional(),
  openingBalance: z.coerce.number().optional(),
  openingBalanceType: z.enum(['Dr', 'Cr']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MasterForm({
  isOpen,
  onClose,
  onSubmit,
  itemTypeFromButton,
  initialData,
  fixedIds = [],
}: MasterFormProps) {
  const isEditingFixed = initialData ? fixedIds.includes(initialData.id) : false;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Customer",
      commission: undefined,
      commissionType: 'Percentage',
      openingBalance: undefined,
      openingBalanceType: 'Dr',
    },
  });

  const itemType = form.watch('type');
  
  React.useEffect(() => {
    const type = initialData?.type || itemTypeFromButton;
    form.reset({
      name: initialData?.name || "",
      type: type,
      commission: (initialData as Agent | Broker)?.details?.commission || undefined,
      commissionType: (initialData as Broker)?.details?.commissionType || 'Percentage',
      openingBalance: initialData?.details?.openingBalance || undefined,
      openingBalanceType: initialData?.details?.openingBalanceType || 'Dr',
    });
  }, [initialData, itemTypeFromButton, form]);

  const handleSubmit = (values: FormValues) => {
    const itemData: MasterItem = {
      id: initialData?.id || `${itemType.toLowerCase()}-${Date.now()}`,
      type: values.type,
      name: values.name,
      details: {
        ...(values.type === 'Agent' || values.type === 'Broker' ? { commission: values.commission, commissionType: values.commissionType } : {}),
        openingBalance: values.openingBalance,
        openingBalanceType: values.openingBalanceType,
      },
    };
    onSubmit(itemData);
    onClose();
  };
  
  const allMasterTypes = Object.keys(MASTER_TYPES_CONFIG) as MasterItemType[];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Add"} Master Item
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the master item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditingFixed}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select an item type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allMasterTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{itemType} Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${itemType.toLowerCase()} name`} {...field} disabled={isEditingFixed} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(itemType === 'Agent' || itemType === 'Broker') && (
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1.5" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {itemType === 'Broker' && (
                    <FormField
                      control={form.control}
                      name="commissionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger></FormControl>
                             <SelectContent>
                                <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                <SelectItem value="Fixed">Fixed (₹)</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
              </div>
            )}
            
            {(['Supplier', 'Customer', 'Agent', 'Broker'].includes(itemType)) && (
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="openingBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Balance (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="openingBalanceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Balance Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger></FormControl>
                             <SelectContent>
                                <SelectItem value="Dr">Debit (Receivable)</SelectItem>
                                <SelectItem value="Cr">Credit (Payable)</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
