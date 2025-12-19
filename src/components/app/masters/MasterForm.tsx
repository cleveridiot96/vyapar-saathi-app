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
import type { MasterItem, MasterItemType } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MASTER_TYPES_CONFIG } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Unlock } from "lucide-react";

interface MasterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: MasterItem) => void;
  onToggleLock?: (item: MasterItem) => void;
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
  onToggleLock,
  itemTypeFromButton,
  initialData,
  fixedIds = [],
}: MasterFormProps) {
  const isEditingFixed = initialData ? fixedIds.includes(initialData.id) : false;
  const isLocked = initialData?.locked || isEditingFixed;


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
      commission: initialData?.details?.commission,
      commissionType: initialData?.details?.commissionType || 'Percentage',
      openingBalance: initialData?.details?.openingBalance,
      openingBalanceType: initialData?.details?.openingBalanceType || 'Dr',
    });
  }, [initialData, itemTypeFromButton, form]);

  const handleSubmit = (values: FormValues) => {
    if (isLocked) return;
    const itemData: MasterItem = {
      id: initialData?.id || `${values.type.toLowerCase()}-${Date.now()}`,
      type: values.type,
      name: values.name,
      locked: initialData?.locked || false,
      details: {
        ...(values.type === 'Agent' || values.type === 'Broker' ? { commission: values.commission, commissionType: values.commissionType } : {}),
        openingBalance: values.openingBalance,
        openingBalanceType: values.openingBalanceType,
      },
    };
    onSubmit(itemData);
    onClose();
  };
  
  const allMasterTypes = Object.keys(MASTER_TYPES_CONFIG).filter(type => type !== 'Product') as MasterItemType[];
  const getSingularLabel = (type: MasterItemType) => {
    if (type === 'Expense') return 'Expense'; // Already singular
    return type.endsWith('s') ? type.slice(0, -1) : type;
  }
  const singularLabel = getSingularLabel(itemType);

  const handleUnlock = () => {
    if (initialData && onToggleLock) {
      onToggleLock(initialData);
      onClose();
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialData ? `Edit ${singularLabel}` : `Add New ${singularLabel}`}
          </DialogTitle>
          {isLocked && (
            <DialogDescription className="text-yellow-600 flex items-center gap-2 pt-2">
              <Lock className="h-4 w-4" /> This item is locked. Unlock to edit.
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="-mx-6 flex-1 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLocked || !!initialData}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select an item type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allMasterTypes.map(type => (
                            <SelectItem key={type} value={type}>{getSingularLabel(type)}</SelectItem>
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
                  <FormLabel>{singularLabel} Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${singularLabel.toLowerCase()} name`} {...field} disabled={isLocked} />
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
                          <Input type="number" placeholder="e.g., 1.5" {...field} disabled={isLocked} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
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
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isLocked}>
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
                          <Input type="number" placeholder="0" {...field} disabled={isLocked} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLocked}>
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
          </form>
        </Form>
        </ScrollArea>
        <DialogFooter className="border-t pt-4 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
           {isLocked && onToggleLock ? (
            <Button type="button" variant="secondary" onClick={handleUnlock}>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock & Close
            </Button>
          ) : (
            <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isLocked}>Save</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
