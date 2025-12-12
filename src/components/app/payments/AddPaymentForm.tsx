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
import { paymentSchema, type PaymentFormValues } from "@/lib/schemas/paymentSchema";
import type { MasterItem, Payment, MasterItemType, Purchase } from "@/lib/types";
import { MasterDataCombobox } from "@/components/shared/MasterDataCombobox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { MasterForm } from "@/components/app/masters/MasterForm";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useInventory } from "@/hooks/useInventory";

interface AddPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: Payment) => void;
  parties: MasterItem[]; 
  onMasterDataUpdate: (item: MasterItem) => void;
  allPurchases: Purchase[];
  allPayments: Payment[];
  paymentToEdit?: Payment | null;
}

export const AddPaymentForm: React.FC<AddPaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parties, 
  onMasterDataUpdate,
  allPurchases,
  allPayments,
  paymentToEdit
}) => {
  const { toast } = useToast();
  const { availableStock } = useInventory();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
  const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);
  const [masterItemToEdit, setMasterItemToEdit] = React.useState<MasterItem | null>(null);

  const methods = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: paymentToEdit
      ? {
          date: new Date(paymentToEdit.date),
          partyId: paymentToEdit.partyId,
          amount: paymentToEdit.paymentType !== 'Stock' ? paymentToEdit.amount : undefined,
          paymentMethod: paymentToEdit.paymentMethod,
          paymentType: paymentToEdit.paymentType || 'Regular',
          notes: paymentToEdit.notes || "",
          stockItems: paymentToEdit.stockItems || [],
          againstPurchases: paymentToEdit.againstPurchases || []
        }
      : {
          date: new Date(),
          partyId: undefined,
          amount: undefined,
          paymentMethod: 'Cash',
          paymentType: 'Regular',
          notes: "",
          stockItems: [],
          againstPurchases: []
        },
  });
  const { control, handleSubmit, watch } = methods;
  const { fields: stockItemFields, append: appendStockItem, remove: removeStockItem } = useFieldArray({ control, name: "stockItems" });

  const watchedPaymentType = watch('paymentType');

  const handleOpenMasterForm = (type: MasterItemType = "Supplier") => {
    setMasterItemToEdit(null);
    setMasterFormItemType(type); 
    setIsMasterFormOpen(true);
  };
  
  const handleEditMasterItem = (id: string) => {
    const itemToEdit = parties.find(p => p.id === id) || null;
    if (itemToEdit) {
      setMasterItemToEdit(itemToEdit);
      setMasterFormItemType(itemToEdit.type);
      setIsMasterFormOpen(true);
    }
  }

  const handleMasterFormSubmit = (newItem: MasterItem) => {
    onMasterDataUpdate(newItem);
    if (["Supplier", "Agent", "Transporter"].includes(newItem.type)) { 
        methods.setValue('partyId', newItem.id, { shouldValidate: true });
    }
    setIsMasterFormOpen(false);
    setMasterItemToEdit(null);
    toast({ title: `${newItem.type} "${newItem.name}" added/updated successfully!` });
  };

  const processSubmit = React.useCallback((values: PaymentFormValues) => {
    setIsSubmitting(true);
    const selectedParty = parties.find(p => p.id === values.partyId);
    if (!selectedParty) {
      toast({ title: "Error", description: "Selected party not found.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }
    
    let finalAmount = values.amount || 0;
    if (values.paymentType === 'Stock') {
        finalAmount = (values.stockItems || []).reduce((sum, item) => sum + (item.rate * item.netWeight), 0);
    }

    const paymentData: Payment = {
      id: paymentToEdit ? paymentToEdit.id : `payment-${Date.now()}`,
      date: format(values.date, "yyyy-MM-dd"),
      partyId: values.partyId as string,
      partyName: selectedParty.name,
      partyType: selectedParty.type,
      amount: finalAmount,
      paymentMethod: values.paymentMethod,
      paymentType: values.paymentType,
      notes: values.notes,
      stockItems: values.paymentType === 'Stock' ? values.stockItems?.map(si => ({...si, value: si.rate * si.netWeight})) : [],
      againstPurchases: values.againstPurchases || []
    };
    onSubmit(paymentData);
    setIsSubmitting(false);
    onClose();
  }, [paymentToEdit, parties, onSubmit, onClose, toast]);


  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen && !isMasterFormOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{paymentToEdit ? 'Edit Payment' : 'Add New Payment'}</DialogTitle>
            <DialogDescription>
              Enter the details for the payment. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
              <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-3">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Payment Date</FormLabel>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "dd/MM/yy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={(date) => { if(date) field.onChange(date); setIsDatePickerOpen(false); }} disabled={(date) => date > new Date()} initialFocus />
                        </PopoverContent>
                      </Popover><FormMessage />
                    </FormItem>)}
                  />
                  <FormField control={control} name="partyId" render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Party (Supplier/Agent/etc)</FormLabel>
                      <MasterDataCombobox value={field.value} onChange={field.onChange}
                        options={parties.map(p => ({ value: p.id, label: `${p.name} (${p.type})` }))}
                        placeholder="Select Party" searchPlaceholder="Search parties..." notFoundMessage="No party found."
                        addNewLabel="Add New Party"
                        onAddNew={() => handleOpenMasterForm()}
                        onEdit={handleEditMasterItem}
                      /> <FormMessage />
                    </FormItem>)}
                  />
                  <FormField control={control} name="paymentType" render={({ field }) => (
                     <FormItem>
                      <FormLabel>Payment Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'Regular'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem><SelectItem value="Stock">Stock (Kind)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                  {watchedPaymentType === 'Regular' && (
                    <FormField control={control} name="amount" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount Paid (₹)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="Enter amount paid" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                        <FormMessage />
                        </FormItem>)}
                    />
                  )}
                  <FormField control={control} name="paymentMethod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'Cash'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="UPI">UPI</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                </div>
                
                {watchedPaymentType === 'Stock' && (
                  <Card className="mt-4 p-4 space-y-4">
                    <CardHeader className="p-0 mb-2"><CardTitle className="text-md">Stock Items Given</CardTitle></CardHeader>
                    <CardContent className="p-0 space-y-2">
                       {stockItemFields.map((item, index) => (
                         <div key={item.id} className="grid grid-cols-5 gap-2 items-end">
                            <FormField control={control} name={`stockItems.${index}.lotNumber`} render={({field}) => (
                                <FormItem className="col-span-2"><FormLabel>Vakkal/Lot</FormLabel>
                                <MasterDataCombobox options={availableStock.map(s => ({label: `${s.lotNumber} (Avl: ${s.currentBags})`, value: s.lotNumber}))} {...field} placeholder="Select Stock" />
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={control} name={`stockItems.${index}.quantity`} render={({field}) => (<FormItem><FormLabel>Bags</FormLabel><Input type="number" placeholder="Bags" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}/><FormMessage/></FormItem>)}/>
                            <FormField control={control} name={`stockItems.${index}.netWeight`} render={({field}) => (<FormItem><FormLabel>Net Wt.</FormLabel><Input type="number" step="0.01" placeholder="Kg" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}/><FormMessage/></FormItem>)}/>
                            <FormField control={control} name={`stockItems.${index}.rate`} render={({field}) => (<FormItem><FormLabel>Rate</FormLabel><Input type="number" step="0.01" placeholder="₹/Kg" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}/><FormMessage/></FormItem>)}/>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStockItem(index)}><Trash2 className="h-4 w-4" /></Button>
                         </div>
                       ))}
                       <Button type="button" variant="outline" size="sm" onClick={() => appendStockItem({ lotNumber: '', quantity: 0, netWeight: 0, rate: 0, value: 0})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Stock Item
                       </Button>
                    </CardContent>
                  </Card>
                )}


                <FormField control={control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Add any notes for this payment..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>)}
                />
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (paymentToEdit ? "Saving..." : "Adding...") : (paymentToEdit ? "Save Changes" : "Add Payment")}
                  </Button>
                </DialogFooter>
              </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {isMasterFormOpen && (
        <MasterForm
          isOpen={isMasterFormOpen}
          onClose={() => { setIsMasterFormOpen(false); setMasterItemToEdit(null); }}
          onSubmit={handleMasterFormSubmit}
          initialData={masterItemToEdit}
          itemType={masterFormItemType!} 
        />
      )}
    </>
  );
};
