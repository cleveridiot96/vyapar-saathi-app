
"use client";
import * as React from "react";
import { useForm, FormProvider, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { LocationTransfer, MasterItem, ExpenseItem, MasterItemType } from "@/lib/types";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useInventory } from "@/hooks/useInventory";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterForm } from "@/components/app/masters/MasterForm";
import dynamic from 'next/dynamic';

const MasterDataCombobox = dynamic(() => import('@/components/shared/MasterDataCombobox').then(mod => mod.MasterDataCombobox), { ssr: false });

interface AddLocationTransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transfer: LocationTransfer) => void;
  transferToEdit?: LocationTransfer | null;
}

const locationTransferSchema = z.object({
  date: z.date(),
  fromLocationId: z.string().min(1, "Source location is required."),
  toLocationId: z.string().min(1, "Destination location is required."),
  transporterId: z.string().optional(),
  items: z.array(z.object({
    originalLotNumber: z.string().min(1, "Original Lot number is required."),
    newLotNumber: z.string().min(1, "New Lot number is required."),
    quantity: z.coerce.number().positive("Quantity must be positive."),
    netWeight: z.coerce.number().positive("Net weight must be positive."),
    costOfGoods: z.coerce.number().positive("Cost of goods must be positive."),
  })).min(1, "At least one item is required."),
  expenses: z.array(z.object({
    id: z.string(),
    account: z.string().min(1, "Account name is required."),
    amount: z.coerce.number().min(0.01, "Amount must be positive."),
    paymentMode: z.enum(["Cash", "Bank", "Pending"]),
    partyId: z.string().optional(),
    partyName: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});
type LocationTransferFormValues = z.infer<typeof locationTransferSchema>;

const AddLocationTransferFormComponent: React.FC<AddLocationTransferFormProps> = ({ isOpen, onClose, onSubmit, transferToEdit }) => {
  const { toast } = useToast();
  const { masterData, addOrUpdateMaster, getAllMasters } = useTransactions();
  const { warehouses, transporters, expenses: expenseAccounts } = masterData;
  const { availableStock } = useInventory(transferToEdit?.id);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
  const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);

  const methods = useForm<LocationTransferFormValues>({
    resolver: zodResolver(locationTransferSchema),
    defaultValues: transferToEdit
      ? {
          date: new Date(transferToEdit.date),
          fromLocationId: transferToEdit.fromLocationId,
          toLocationId: transferToEdit.toLocationId,
          transporterId: transferToEdit.transporterId || undefined,
          items: transferToEdit.items.map(i => ({
            originalLotNumber: i.originalLotNumber,
            newLotNumber: i.newLotNumber,
            quantity: i.quantity,
            netWeight: i.netWeight,
            costOfGoods: i.costOfGoods,
          })),
          expenses: transferToEdit.expenses || [],
          notes: transferToEdit.notes || "",
        }
      : {
          date: new Date(),
          items: [{ originalLotNumber: '', newLotNumber: '', quantity: 0, netWeight: 0, costOfGoods: 0 }],
          expenses: [],
        },
  });

  const { control, handleSubmit, watch, setValue } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({ control, name: "expenses" });

  const fromLocationId = watch('fromLocationId');

  const handleOpenMasterForm = React.useCallback((type: MasterItemType) => {
    setMasterFormItemType(type);
    setIsMasterFormOpen(true);
  }, []);

  const processSubmit = (values: LocationTransferFormValues) => {
    setIsSubmitting(true);

    const fromLocation = (warehouses || []).find(w => w.id === values.fromLocationId);
    const toLocation = (warehouses || []).find(w => w.id === values.toLocationId);

    const totalExpenses = values.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

    const transferData: LocationTransfer = {
      id: transferToEdit?.id || `lt-${Date.now()}`,
      date: format(values.date, "yyyy-MM-dd"),
      fromLocationId: values.fromLocationId,
      fromLocationName: fromLocation?.name || 'Unknown',
      toLocationId: values.toLocationId,
      toLocationName: toLocation?.name || 'Unknown',
      items: values.items.map(i => ({...i, id: `lti-${Math.random()}`})),
      totalTransferCost: totalExpenses,
      notes: values.notes,
      expenses: values.expenses,
      transporterId: values.transporterId,
    };
    
    onSubmit(transferData);
    setIsSubmitting(false);
    onClose();
  };

  const stockOptions = React.useMemo(() => 
    availableStock
      .filter(s => s.locationId === fromLocationId)
      .map(s => ({ value: s.lotNumber, label: `${s.lotNumber} (${s.currentBags} bags)`}))
  , [availableStock, fromLocationId]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{transferToEdit ? 'Edit Location Transfer' : 'New Location Transfer'}</DialogTitle>
          <DialogDescription>Move stock between warehouses and account for costs.</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField control={control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Transfer Date</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild><FormControl>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => { if (d) field.onChange(d); setIsDatePickerOpen(false); }} initialFocus /></PopoverContent>
                  </Popover><FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="fromLocationId" render={({ field }) => (
                <FormItem><FormLabel>From Warehouse</FormLabel>
                  <MasterDataCombobox options={(warehouses || []).map(w => ({ value: w.id, label: w.name }))} placeholder="Select source" onAddNew={() => handleOpenMasterForm("Warehouse")} {...field} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="toLocationId" render={({ field }) => (
                <FormItem><FormLabel>To Warehouse</FormLabel>
                  <MasterDataCombobox options={(warehouses || []).map(w => ({ value: w.id, label: w.name }))} placeholder="Select destination" onAddNew={() => handleOpenMasterForm("Warehouse")} {...field} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">Items to Transfer</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 border-b">
                    <FormField control={control} name={`items.${index}.originalLotNumber`} render={({ field: itemField }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Original Lot</FormLabel>
                        <MasterDataCombobox options={stockOptions} placeholder="Select stock" {...itemField} 
                          onChange={(val) => {
                              itemField.onChange(val);
                              const stock = availableStock.find(s => s.lotNumber === val);
                              if(stock) {
                                setValue(`items.${index}.newLotNumber`, `${stock.lotNumber}-TR`);
                                setValue(`items.${index}.quantity`, stock.currentBags);
                                setValue(`items.${index}.netWeight`, stock.currentBags * stock.averageWeightPerBag);
                                setValue(`items.${index}.costOfGoods`, stock.currentBags * stock.averageWeightPerBag * stock.effectiveRate);
                              }
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={control} name={`items.${index}.newLotNumber`} render={({ field: itemField }) => (
                      <FormItem><FormLabel>New Lot #</FormLabel><Input placeholder="New lot name" {...itemField} /><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name={`items.${index}.quantity`} render={({ field: itemField }) => (
                      <FormItem><FormLabel>Bags</FormLabel><Input type="number" placeholder="Bags" {...itemField} /><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name={`items.${index}.netWeight`} render={({ field: itemField }) => (
                      <FormItem><FormLabel>Net Wt.</FormLabel><Input type="number" step="0.01" placeholder="Weight" {...itemField} /><FormMessage /></FormItem>
                    )} />
                     <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ originalLotNumber: '', newLotNumber: '', quantity: 0, netWeight: 0, costOfGoods: 0 })}>
                  <PlusCircle className="mr-2" /> Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Expenses</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                {expenseFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border-b last:border-b-0">
                        <FormField control={control} name={`expenses.${index}.account`} render={({ field: itemField }) => (
                            <FormItem className="md:col-span-4"><FormLabel>Account</FormLabel>
                            <Select onValueChange={itemField.onChange} value={itemField.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger></FormControl>
                                <SelectContent>{(expenseAccounts || []).map(opt => <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                            </FormItem>)} />
                        <FormField control={control} name={`expenses.${index}.amount`} render={({ field: { onChange, ...itemField } }) => (
                            <FormItem className="md:col-span-3"><FormLabel>Amount (₹)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="Amount" {...itemField} value={itemField.value ?? ''} onChange={e => onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                            <FormMessage /></FormItem>)} />
                        <FormField control={control} name={`expenses.${index}.paymentMode`} render={({ field: itemField }) => (
                            <FormItem className="md:col-span-4"><FormLabel>Pay Mode</FormLabel>
                            <Select onValueChange={itemField.onChange} defaultValue={itemField.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
                            </Select><FormMessage /></FormItem>)} />
                        <div className="md:col-span-1 flex items-center justify-end">
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeExpense(index)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendExpense({ id: `exp-${Date.now()}`, account: '', amount: 0, paymentMode: "Cash" })} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                </Button>
                </CardContent>
            </Card>


            <FormField control={control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><Textarea placeholder="Any notes about this transfer..." {...field} /><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (transferToEdit ? 'Save Changes' : 'Create Transfer')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
     {isMasterFormOpen && (
        <MasterForm
          isOpen={isMasterFormOpen}
          onClose={() => setIsMasterFormOpen(false)}
          onSubmit={addOrUpdateMaster}
          initialData={null}
          itemTypeFromButton={masterFormItemType!}
        />
      )}
    </>
  );
};

export const AddLocationTransferForm = React.memo(AddLocationTransferFormComponent);
