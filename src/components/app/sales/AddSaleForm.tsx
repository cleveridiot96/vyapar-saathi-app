"use client";

import * as React from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { format } from "date-fns";
import { saleSchema, type SaleFormValues } from '@/lib/schemas/saleSchema';
import type { MasterItem, Sale, ExpenseItem, AggregatedInventoryItem, MasterItemType } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import dynamic from 'next/dynamic';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMasters, useTransactions } from "@/hooks/useTransactions";
import { useInventory } from "@/hooks/useInventory";

const MasterDataCombobox = dynamic(() => import('@/components/shared/MasterDataCombobox').then(mod => mod.MasterDataCombobox), { ssr: false });
const MasterForm = dynamic(() => import('@/components/app/masters/MasterForm').then(mod => mod.MasterForm), { ssr: false });


interface AddSaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: Sale) => void;
  existingSales: Sale[];
  saleToEdit?: Sale | null;
}

const AddSaleFormComponent: React.FC<AddSaleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingSales,
  saleToEdit,
}) => {
  const { toast } = useToast();
  const { customers, brokers, getAllMasters, addOrUpdateMaster } = useMasters();
  const { availableStock } = useInventory(saleToEdit?.id);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
  const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);
  const [masterItemToEdit, setMasterItemToEdit] = React.useState<MasterItem | null>(null);
  
  const memoizedSaleSchema = React.useMemo(() =>
    saleSchema(existingSales, availableStock, saleToEdit?.id)
  , [availableStock, existingSales, saleToEdit]);

  const methods = useForm<SaleFormValues>({
    resolver: zodResolver(memoizedSaleSchema),
    defaultValues: {
      date: new Date(),
      items: [{ lotNumber: "", quantity: 0, netWeight: 0, rate: 0 }],
      expenses: [],
      notes: "",
    },
    mode: 'onChange',
  });
  const { control, handleSubmit, reset, watch } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({ control, name: "expenses" });
  
  const allMasters = getAllMasters();
  
  React.useEffect(() => {
    if (saleToEdit) {
      reset({
        ...saleToEdit,
        date: new Date(saleToEdit.date)
      });
    } else {
      reset({
        date: new Date(),
        items: [{ lotNumber: "", quantity: 0, netWeight: 0, rate: 0 }],
        expenses: [],
      });
    }
  }, [saleToEdit, reset]);

  const processSubmit = (values: SaleFormValues) => {
    setIsSubmitting(true);
    const selectedCustomer = allMasters.find(c => c.id === values.customerId);
    const selectedBroker = allMasters.find(b => b.id === values.brokerId);

    const totalSaleSideExpenses = (values.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalNetWeight = values.items.reduce((sum, item) => sum + (item.netWeight || 0), 0);
    const saleSideExpensesPerKg = totalNetWeight > 0 ? totalSaleSideExpenses / totalNetWeight : 0;
    
    const saleData: Sale = {
      id: saleToEdit?.id || `sale-${Date.now()}`,
      date: format(values.date, "yyyy-MM-dd"),
      billNumber: values.billNumber,
      customerId: values.customerId,
      customerName: selectedCustomer?.name,
      brokerId: values.brokerId,
      brokerName: selectedBroker?.name,
      items: values.items.map(item => {
          const stock = availableStock.find(s => s.lotNumber === item.lotNumber);
          const landedCostPerKg = stock?.effectiveRate || 0;
          const basePurchaseRate = stock?.purchaseRate || 0;
          const netWeight = item.netWeight || 0;
          const saleRate = item.rate || 0;
          const goodsValue = netWeight * saleRate;

          const costOfGoodsSold = netWeight * landedCostPerKg;
          const itemGrossProfit = goodsValue - (netWeight * basePurchaseRate);
          const itemShareOfSaleExpenses = netWeight * saleSideExpensesPerKg;
          
          return {
              id: `sitem-${Date.now()}-${Math.random()}`,
              lotNumber: item.lotNumber,
              quantity: Math.round(item.quantity || 0),
              netWeight: item.netWeight,
              rate: saleRate,
              goodsValue: Math.round(goodsValue),
              purchaseRate: basePurchaseRate,
              costOfGoodsSold: costOfGoodsSold,
              itemGrossProfit: Math.round(itemGrossProfit),
              itemNetProfit: Math.round(goodsValue - costOfGoodsSold - itemShareOfSaleExpenses),
          };
      }),
      expenses: values.expenses as ExpenseItem[] | undefined,
      totalGoodsValue: values.items.reduce((acc, item) => acc + (item.netWeight || 0) * (item.rate || 0), 0),
      billedAmount: values.items.reduce((acc, item) => acc + (item.netWeight || 0) * (item.rate || 0), 0),
      totalQuantity: values.items.reduce((acc, item) => acc + (item.quantity || 0), 0),
      totalNetWeight: totalNetWeight,
      totalCostOfGoodsSold: values.items.reduce((acc, item) => {
          const stock = availableStock.find(s => s.lotNumber === item.lotNumber);
          return acc + (item.netWeight || 0) * (stock?.effectiveRate || 0);
      }, 0),
      totalGrossProfit: 0, 
      totalCalculatedProfit: 0,
      notes: values.notes,
      isStockPaymentSale: false,
    };
    onSubmit(saleData);
    setIsSubmitting(false);
  };
  
  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen && !isMasterFormOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{saleToEdit ? 'Edit Sale' : 'Add New Sale'}</DialogTitle>
            <DialogDescription>Create a sale with one or more items.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 pb-6">
                <FormProvider {...methods}>
                <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 pt-4">
                    <div className="p-4 border rounded-md shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                            control={control}
                            name="date"
                            render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>Sale Date</FormLabel>
                                <DatePicker
                                  date={field.value}
                                  onDateChange={field.onChange}
                                />
                                <FormMessage />
                              </FormItem>)} />
                        <FormField control={control} name="billNumber" render={({ field }) => (
                          <FormItem><FormLabel>Bill Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., INV-001" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="customerId" render={({ field }) => (
                          <FormItem><FormLabel>Customer</FormLabel>
                            <MasterDataCombobox 
                              value={field.value} 
                              onChange={field.onChange} 
                              options={(customers || []).map(c => ({ value: c.id, label: c.name }))} 
                              placeholder="Select Customer" 
                            /> <FormMessage />
                          </FormItem>)} />
                        <FormField control={control} name="brokerId" render={({ field }) => (
                          <FormItem><FormLabel>Broker (Optional)</FormLabel>
                            <MasterDataCombobox 
                              value={field.value} 
                              onChange={field.onChange} 
                              options={(brokers || []).map(b => ({ value: b.id, label: b.name }))} 
                              placeholder="Select Broker" 
                            />
                            <FormMessage />
                          </FormItem>)} />
                      </div>
                    </div>

                    <div className="p-4 border rounded-md shadow-sm">
                      <h3 className="text-lg font-medium text-primary">Items</h3>
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border-b last:border-b-0">
                          <FormField control={control} name={`items.${index}.lotNumber`} render={({ field: itemField }) => (
                            <FormItem className="md:col-span-3"><FormLabel>Vakkal/Lot</FormLabel>
                              <MasterDataCombobox
                                value={itemField.value}
                                onChange={itemField.onChange}
                                options={availableStock.map(s => ({ value: s.lotNumber, label: `${s.lotNumber} (${Math.round(s.currentBags)} bags)`}))}
                                placeholder="Select Vakkal/Lot"
                              />
                              <FormMessage />
                            </FormItem>)} />
                          <FormField control={control} name={`items.${index}.quantity`} render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Bags</FormLabel>
                              <FormControl><Input type="number" placeholder="Bags" {...itemField} value={itemField.value ?? ''} onChange={e => itemField.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                              <FormMessage />
                            </FormItem>)} />
                          <FormField control={control} name={`items.${index}.netWeight`} render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Net Wt.</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Kg" {...itemField} value={itemField.value ?? ''} onChange={e => itemField.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={control} name={`items.${index}.rate`} render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Sale Rate</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="₹/kg" {...itemField} value={itemField.value ?? ''} onChange={e => itemField.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                              <FormMessage />
                            </FormItem>)} />
                          <div className="md:col-span-2"><FormLabel>Goods Value (₹)</FormLabel><div className="font-medium text-sm h-10 flex items-center px-3 border border-dashed rounded-md bg-muted/50 text-foreground/80">{Math.round((watch(`items.${index}.netWeight`) || 0) * (watch(`items.${index}.rate`) || 0)).toLocaleString('en-IN')}</div></div>
                          <div className="md:col-span-1 flex items-end justify-end"><Button type="button" variant="destructive" size="icon" onClick={() => fields.length > 1 ? remove(index) : null} disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => append({ lotNumber: "", quantity: 0, netWeight: 0, rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
                    </div>
                </form>
                </FormProvider>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
            <Button type="button" onClick={handleSubmit(processSubmit)} disabled={isSubmitting}>{isSubmitting ? "Saving..." : (saleToEdit ? "Save Changes" : "Create Sale")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const AddSaleForm = React.memo(AddSaleFormComponent);

    