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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Info, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { saleSchema, type SaleFormValues } from '@/lib/schemas/saleSchema';
import type { MasterItem, MasterItemType, Sale, ExpenseItem, AggregatedInventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { MasterForm } from '@/components/app/masters/MasterForm';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTransactions } from "@/hooks/useTransactions";
import { useInventory } from "@/hooks/useInventory";
import dynamic from 'next/dynamic';

const MasterDataCombobox = dynamic(() => import('@/components/shared/MasterDataCombobox').then(mod => mod.MasterDataCombobox), { ssr: false });


interface AddSaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: Sale) => void;
  existingSales: Sale[];
  saleToEdit?: Sale | null;
  onMasterDataUpdate: (newItem: MasterItem) => void;
}

const AddSaleFormComponent: React.FC<AddSaleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingSales,
  saleToEdit,
  onMasterDataUpdate,
}) => {
  const { toast } = useToast();
  const { masterData, addOrUpdateMaster, getAllMasters } = useTransactions();
  const { customers, transporters, brokers, expenses, warehouses } = masterData;
  const { availableStock } = useInventory(saleToEdit?.id);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
  const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);
  const [masterItemToEdit, setMasterItemToEdit] = React.useState<MasterItem | null>(null);
  const [manualNetWeight, setManualNetWeight] = React.useState<Record<number, boolean>>({});
  const [lastRates, setLastRates] = React.useState<Record<number, number | null>>({});

  const formMethods = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema(existingSales, availableStock, saleToEdit?.id)),
    defaultValues: saleToEdit
      ? {
          date: new Date(saleToEdit.date),
          billNumber: saleToEdit.billNumber || "",
          customerId: saleToEdit.customerId,
          brokerId: saleToEdit.brokerId || undefined,
          transporterId: saleToEdit.transporterId || undefined,
          items: saleToEdit.items.map(item => ({
              lotNumber: item.lotNumber,
              quantity: item.quantity,
              netWeight: item.netWeight,
              rate: item.rate
          })),
          expenses: saleToEdit.expenses || [],
          notes: saleToEdit.notes || "",
          cbAmount: saleToEdit.cbAmount || undefined,
          balanceAmount: saleToEdit.balanceAmount || undefined,
        }
      : {
          date: new Date(),
          billNumber: "",
          customerId: undefined,
          brokerId: undefined,
          transporterId: undefined,
          items: [{ lotNumber: "", quantity: undefined, netWeight: undefined, rate: undefined }],
          expenses: [],
          notes: "",
          cbAmount: undefined,
          balanceAmount: undefined,
        },
    mode: 'onChange',
  });
  
  const { control, watch, setValue, handleSubmit, formState: { errors } } = formMethods;

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({ control, name: "expenses" });
  
  const watchedFormValues = watch();
  const watchedCustomerId = watch("customerId");
  const watchedItems = watch("items");

  React.useEffect(() => {
    if (!watchedCustomerId || !watchedItems) return;
  
    const newLastRates: Record<number, number | null> = {};
  
    watchedItems.forEach((item, index) => {
      if (item.lotNumber && watchedCustomerId) {
        const pastSales = existingSales
          .filter(sale => sale.customerId === watchedCustomerId)
          .filter(sale => sale.items.some(saleItem => saleItem.lotNumber === item.lotNumber))
          .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  
        if (pastSales.length > 0) {
          const lastSaleOfItem = pastSales[0].items.find(i => i.lotNumber === item.lotNumber);
          newLastRates[index] = lastSaleOfItem ? lastSaleOfItem.rate : null;
        } else {
          newLastRates[index] = null;
        }
      } else {
        newLastRates[index] = null;
      }
    });
  
    setLastRates(newLastRates);
  }, [watchedCustomerId, watchedItems, existingSales]);


  const summary = React.useMemo(() => {
    const { items, expenses: formExpenses, cbAmount } = watchedFormValues;
      
    let totalGoodsValue = 0;
    let totalNetWeight = 0;
    let totalQuantity = 0;
    let totalLandedCost = 0;
    let totalBasePurchaseCost = 0;

    (items || []).forEach(item => {
        const stockInfo = availableStock.find(s => s.lotNumber === item.lotNumber);
        const landedCostPerKg = stockInfo?.effectiveRate || 0;
        const basePurchaseRate = stockInfo?.purchaseRate || 0;
        
        const netWeight = Number(item.netWeight) || 0;
        const saleRate = Number(item.rate) || 0;
        const quantity = Number(item.quantity) || 0;

        const lineSaleValue = netWeight * saleRate;
        
        totalGoodsValue += lineSaleValue;
        totalLandedCost += netWeight * landedCostPerKg;
        totalBasePurchaseCost += netWeight * basePurchaseRate;
        totalNetWeight += netWeight;
        totalQuantity += quantity;
    });

    const totalSaleSideExpenses = (formExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const billedAmount = totalGoodsValue - (cbAmount || 0); // Billed amount is after CB
    const grossProfit = totalGoodsValue - totalBasePurchaseCost;
    const netProfit = totalGoodsValue - totalLandedCost - totalSaleSideExpenses;

    return { 
      totalGoodsValue,
      totalNetWeight,
      totalQuantity,
      billedAmount,
      totalBasePurchaseCost,
      totalLandedCost,
      totalGrossProfit: grossProfit,
      totalSaleSideExpenses,
      netProfit, 
    };

  }, [watchedFormValues, availableStock]);

  const brokerId = watch('brokerId');
  
  React.useEffect(() => {
    if(!brokers) return;
    const currentExpenses = watch('expenses') || [];

    const broker = brokers.find(b => b.id === brokerId);
    const commissionIndex = currentExpenses.findIndex(exp => exp.account === 'Broker Commission');
    
    if (broker && broker.details?.commission && summary.totalGoodsValue > 0) {
        let commissionAmount = 0;
        if (broker.details.commissionType === 'Percentage') {
            commissionAmount = summary.totalGoodsValue * (broker.details.commission / 100);
        } else {
            commissionAmount = broker.details.commission;
        }

        const newCommissionExpense: ExpenseItem = {
            id: currentExpenses[commissionIndex]?.id || `exp-comm-${Date.now()}`,
            account: 'Broker Commission',
            amount: parseFloat(commissionAmount.toFixed(2)),
            paymentMode: 'Pending',
            partyId: broker.id,
            partyName: broker.name,
        };
        
        const existingCommission = commissionIndex > -1 ? currentExpenses[commissionIndex] : undefined;
        const hasChanged = !existingCommission ||
                           existingCommission.amount !== newCommissionExpense.amount ||
                           existingCommission.partyId !== newCommissionExpense.partyId;
        
        if (hasChanged) {
            if (commissionIndex > -1) {
                setValue(`expenses.${commissionIndex}`, newCommissionExpense, { shouldValidate: true });
            } else {
                appendExpense(newCommissionExpense);
            }
        }
    } else {
        if (commissionIndex > -1) {
            removeExpense(commissionIndex);
        }
    }
  }, [brokerId, brokers, summary.totalGoodsValue, appendExpense, removeExpense, setValue, watch]);


  const handleOpenMasterForm = (type: MasterItemType) => {
    setMasterItemToEdit(null);
    setMasterFormItemType(type);
    setIsMasterFormOpen(true);
  };
  
  const handleEditMasterItem = (type: MasterItemType, id: string) => {
    const allMasters = getAllMasters();
    const itemToEdit = allMasters.find(i => i.id === id) || null;

    if (itemToEdit) {
        setMasterItemToEdit(itemToEdit);
        setMasterFormItemType(type);
        setIsMasterFormOpen(true);
    }
  };

  const handleMasterFormSubmit = (newItem: MasterItem) => {
    onMasterDataUpdate(newItem);
    if (newItem.type === 'Customer') setValue('customerId', newItem.id, { shouldValidate: true });
    if (newItem.type === 'Broker') setValue('brokerId', newItem.id, { shouldValidate: true });
    if (newItem.type === 'Transporter') setValue('transporterId', newItem.id, { shouldValidate: true });
    setIsMasterFormOpen(false); setMasterItemToEdit(null);
    toast({ title: `${newItem.type} added/updated successfully.` });
  };
  
  const stockOptionsForSale = React.useMemo(() => {
    const mumbaiWarehouseId = (warehouses || []).find(wh => wh.name.toUpperCase() === 'MUMBAI')?.id;
    return (availableStock || [])
      .filter(s => s.locationId === mumbaiWarehouseId)
      .map(s => ({
        value: s.lotNumber,
        label: `${s.lotNumber} (Avl: ${Math.round(s.currentBags)} bags) @ ₹${Math.round(s.purchaseRate)}`,
        tooltipContent: (
          <div>
              <p>Landed Cost: <span className="font-semibold">₹{Math.round(s.effectiveRate)}/kg</span></p>
              <p>Location: <span className="font-semibold">{s.locationName || 'Unknown'}</span></p>
          </div>
        )
      }));
  }, [availableStock, warehouses]);


  const processSubmit = (values: SaleFormValues) => {
    setIsSubmitting(true);
    const selectedCustomer = (customers || []).find(c => c.id === values.customerId);
    const selectedBroker = (brokers || []).find(b => b.id === values.brokerId);
    const selectedTransporter = (transporters || []).find(t => t.id === values.transporterId);

    const totalSaleSideExpenses = (values.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const saleSideExpensesPerKg = summary.totalNetWeight > 0 ? totalSaleSideExpenses / summary.totalNetWeight : 0;

    const saleData: Sale = {
      id: saleToEdit?.id || `sale-${Date.now()}`,
      date: format(values.date, "yyyy-MM-dd"),
      billNumber: values.billNumber,
      customerId: values.customerId,
      customerName: selectedCustomer?.name,
      brokerId: values.brokerId,
      brokerName: selectedBroker?.name,
      transporterId: values.transporterId,
      transporterName: selectedTransporter?.name,
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
              costBreakdown: stock?.costBreakdown || { baseRate: 0, purchaseExpenses: 0, transferExpenses: 0 },
          };
      }),
      expenses: values.expenses?.map(exp => ({ ...exp, id: exp.id || `exp-${Date.now()}-${Math.random()}`, partyName: exp.partyName || 'Self' })),
      totalGoodsValue: Math.round(summary.totalGoodsValue),
      billedAmount: Math.round(summary.billedAmount),
      cbAmount: values.cbAmount,
      balanceAmount: values.balanceAmount,
      totalQuantity: Math.round(summary.totalQuantity),
      totalNetWeight: summary.totalNetWeight,
      totalCostOfGoodsSold: Math.round(summary.totalLandedCost),
      totalGrossProfit: Math.round(summary.totalGrossProfit),
      totalCalculatedProfit: Math.round(summary.netProfit),
      notes: values.notes,
      isStockPaymentSale: false,
    };
    onSubmit(saleData);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen && !isMasterFormOpen} onOpenChange={(openState) => { if (!openState) { onClose(); } }}>
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{saleToEdit ? 'Edit Sale' : 'Add New Sale'}</DialogTitle>
            <DialogDescription>Create a sale with one or more items.</DialogDescription>
          </DialogHeader>
          <TooltipProvider>
            <FormProvider {...formMethods}>
              <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-3">
                  <div className="p-4 border rounded-md shadow-sm">
                    <h3 className="text-lg font-medium mb-3 text-primary">Sale Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField control={control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Sale Date</FormLabel>
                          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}><PopoverTrigger asChild><FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "dd/MM/yy") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={(d) => { if(d) field.onChange(d); setIsDatePickerOpen(false); }} disabled={(date) => date > new Date()} initialFocus /></PopoverContent>
                          </Popover><FormMessage />
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
                            onAddNew={() => handleOpenMasterForm("Customer")}
                            onEdit={(id) => handleEditMasterItem("Customer", id)}
                          /> <FormMessage />
                        </FormItem>)} />
                       <FormField control={control} name="brokerId" render={({ field }) => (
                        <FormItem><FormLabel>Broker (Optional)</FormLabel>
                           <MasterDataCombobox 
                            value={field.value} 
                            onChange={field.onChange} 
                            options={(brokers || []).map(b => ({ value: b.id, label: b.name }))} 
                            placeholder="Select Broker" 
                            onAddNew={() => handleOpenMasterForm("Broker")}
                            onEdit={(id) => handleEditMasterItem("Broker", id)}
                          />
                          <FormMessage />
                        </FormItem>)} />
                    </div>
                  </div>

                  <div className="p-4 border rounded-md shadow-sm">
                    <h3 className="text-lg font-medium text-primary">Quantity & Rate (From Mumbai Warehouse Only)</h3>
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border-b last:border-b-0">
                        <FormField control={control} name={`items.${index}.lotNumber`} render={({ field: itemField }) => (
                          <FormItem className="md:col-span-3"><FormLabel>Vakkal/Lot</FormLabel>
                            <MasterDataCombobox
                              value={itemField.value}
                              onChange={(lotValue) => {
                                itemField.onChange(lotValue);
                                setManualNetWeight(prev => ({ ...prev, [index]: false }));
                                setValue(`items.${index}.quantity`, undefined, { shouldValidate: true });
                                setValue(`items.${index}.netWeight`, undefined, { shouldValidate: true });
                              }}
                              options={stockOptionsForSale}
                              placeholder="Select Lot from Mumbai"
                              notFoundMessage="No stock in Mumbai."
                            />
                            <FormMessage />
                          </FormItem>)} />
                        <FormField control={control} name={`items.${index}.quantity`} render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Bags</FormLabel>
                            <FormControl><Input type="number" placeholder="Bags" {...itemField} value={itemField.value ?? ''} 
                              onChange={e => {
                                  const bagsVal = parseFloat(e.target.value) || undefined;
                                  itemField.onChange(bagsVal);
                                  if (!manualNetWeight[index]) {
                                      const lotValue = watch(`items.${index}.lotNumber`);
                                      const stockInfo = availableStock.find(s => s.lotNumber === lotValue);
                                      if (stockInfo && bagsVal) {
                                          const avgWeightPerBag = stockInfo.averageWeightPerBag || 50;
                                          const newNetWeight = parseFloat((bagsVal * avgWeightPerBag).toFixed(2));
                                          setValue(`items.${index}.netWeight`, newNetWeight, { shouldValidate: true });
                                      } else {
                                          setValue(`items.${index}.netWeight`, undefined, { shouldValidate: true });
                                      }
                                  }
                              }}
                             /></FormControl>
                            <FormMessage />
                          </FormItem>)} />
                        <FormField control={control} name={`items.${index}.netWeight`} render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Net Wt.</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Kg" {...itemField} value={itemField.value ?? ''} 
                              onChange={e => {
                                setManualNetWeight(prev => ({ ...prev, [index]: true }));
                                if (e.target.value) itemField.onChange(parseFloat(e.target.value)); else itemField.onChange(undefined);
                              }}
                          /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name={`items.${index}.rate`} render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Sale Rate</FormLabel>
                            <div className="relative">
                              <FormControl><Input type="number" step="0.01" placeholder="₹/kg" {...itemField} value={itemField.value ?? ''} onChange={e => itemField.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                              {lastRates[index] !== null && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground cursor-help underline decoration-dashed">
                                      LAST: {lastRates[index]}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Last rate for this item & customer was ₹{lastRates[index]}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                         <div className="md:col-span-2">
                            <FormLabel>Goods Value (₹)</FormLabel>
                            <div className="font-medium text-sm h-10 flex items-center px-3 border border-dashed rounded-md bg-muted/50 text-foreground/80">
                                {Math.round((watchedItems[index]?.netWeight || 0) * (watchedItems[index]?.rate || 0)).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="md:col-span-1 flex items-end justify-end">
                           <Tooltip><TooltipTrigger asChild><Button type="button" variant="destructive" size="icon" onClick={() => fields.length > 1 ? remove(index) : null} disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove Item</p></TooltipContent></Tooltip>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-start mt-2">
                      <Button type="button" variant="outline" onClick={() => append({ lotNumber: "", quantity: undefined, netWeight: undefined, rate: undefined })}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md shadow-sm">
                      <h3 className="text-lg font-medium mb-3 text-primary">Expenses &amp; Commission</h3>
                      {expenseFields.map((field, index) => {
                          const isCommission = field.account === 'Broker Commission';
                          return (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border-b last:border-b-0">
                              <FormField control={control} name={`expenses.${index}.account`} render={({ field: itemField }) => (
                                <FormItem className="md:col-span-3"><FormLabel>Account</FormLabel>
                                  <Select onValueChange={itemField.onChange} value={itemField.value} disabled={isCommission}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="Broker Commission">Broker Commission</SelectItem>
                                      <SelectItem value="Extra Brokerage">Extra Brokerage</SelectItem>
                                      {(expenses || []).map(opt => <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>)}
                                    </SelectContent>
                                  </Select><FormMessage />
                                </FormItem>)} />
                              <FormField control={control} name={`expenses.${index}.amount`} render={({ field: itemField }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Amount (₹)</FormLabel>
                                  <FormControl><Input type="number" step="0.01" placeholder="Amount" {...field} readOnly={isCommission} value={itemField.value ?? ''} onChange={e => itemField.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                                  <FormMessage />
                                </FormItem>)} />
                              <FormField control={control} name={`expenses.${index}.partyId`} render={({ field: itemField }) => (
                                <FormItem className="md:col-span-3"><FormLabel>Party (Opt.)</FormLabel>
                                  <MasterDataCombobox value={itemField.value} onChange={itemField.onChange}
                                    options={(getAllMasters() || []).map(p => ({ value: p.id, label: `${p.name} (${p.type})` }))}
                                    placeholder="Select Party" addNewLabel="Add New Party"
                                    onAddNew={() => handleOpenMasterForm("Customer")} onEdit={(id) => handleEditMasterItem("Customer", id)}
                                    disabled={isCommission}
                                  /> <FormMessage />
                                </FormItem>)} />
                              <FormField control={control} name={`expenses.${index}.paymentMode`} render={({ field: itemField }) => (
                                <FormItem className="md:col-span-3"><FormLabel>Pay Mode</FormLabel>
                                  <Select onValueChange={itemField.onChange} defaultValue={itemField.value} disabled={isCommission}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Auto-adjusted">Auto-adjusted</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Bank">Bank</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                    </SelectContent>
                                  </Select><FormMessage />
                                </FormItem>)} />
                              <div className="md:col-span-1 flex items-center justify-end">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeExpense(index)} disabled={isCommission}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          );
                        })}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendExpense({ id: `exp-${Date.now()}`, account: '', amount: 0, paymentMode: "Auto-adjusted" })} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Expense Row
                      </Button>
                  </div>
                  
                  <div className="p-4 border rounded-md shadow-sm grid grid-cols-2 gap-4">
                     <FormField control={control} name="cbAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CB Amount (Optional)</FormLabel>
                            <FormControl><Input type="number" placeholder="Cut Bill Amount" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                            <FormDescription>Amount that bypasses official billing. Does not affect profit.</FormDescription>
                            <FormMessage />
                        </FormItem>)} 
                     />
                      <FormField control={control} name="balanceAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Balance Amount (Optional)</FormLabel>
                            <FormControl><Input type="number" placeholder="Manual Balance" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                             <FormDescription>Any other manually adjusted balance amount.</FormDescription>
                            <FormMessage />
                        </FormItem>)}
                     />
                  </div>

                  <FormField control={control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any notes..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  
                  <Accordion type="single" collapsible className="w-full" defaultValue="summary">
                    <AccordionItem value="summary">
                      <AccordionTrigger>
                        <h3 className="text-lg font-semibold text-primary">Transaction Summary</h3>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 border border-dashed rounded-md bg-muted/50 space-y-2">
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <Tooltip><TooltipTrigger asChild><span className="cursor-help underline decoration-dashed">Total Goods Value:</span></TooltipTrigger><TooltipContent>Sum of (Net Weight * Sale Rate) for all items.</TooltipContent></Tooltip>
                              <span>₹{Math.round(summary.totalGoodsValue).toLocaleString('en-IN')}</span>
                            </div>
                            
                            <div className={`flex justify-between font-bold ${summary.totalGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <Tooltip>
                                <TooltipTrigger asChild><span className="cursor-help underline decoration-dashed">Gross Profit:</span></TooltipTrigger>
                                <TooltipContent>
                                  <p>(Goods Value: ₹{summary.totalGoodsValue.toLocaleString('en-IN', {maximumFractionDigits:0})}) - (Base Purchase Cost: ₹{summary.totalBasePurchaseCost.toLocaleString('en-IN', {maximumFractionDigits:0})})</p>
                                </TooltipContent>
                              </Tooltip>
                              <span>₹{Math.round(summary.totalGrossProfit).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex justify-between text-red-600">
                               <Tooltip>
                                 <TooltipTrigger asChild><span className="cursor-help underline decoration-dashed">Less: All Expenses:</span></TooltipTrigger>
                                 <TooltipContent>
                                   <p>(₹{summary.totalLandedCost.toLocaleString('en-IN', {maximumFractionDigits:0})} Landed Cost - ₹{summary.totalBasePurchaseCost.toLocaleString('en-IN', {maximumFractionDigits:0})} Base Cost) + ₹{summary.totalSaleSideExpenses.toLocaleString('en-IN', {maximumFractionDigits:0})} Sale Expenses</p>
                                 </TooltipContent>
                               </Tooltip>
                              <span>(-) ₹{Math.round(summary.totalLandedCost - summary.totalBasePurchaseCost + summary.totalSaleSideExpenses).toLocaleString('en-IN')}</span>
                            </div>
                            <hr className="my-1 border-muted-foreground/50" />
                            <div className={`flex justify-between font-bold text-base ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                               <Tooltip><TooltipTrigger asChild><span className="cursor-help underline decoration-dashed">Net Profit:</span></TooltipTrigger><TooltipContent><p>(Goods Value) - (Total Landed Cost) - (Sale Expenses)</p></TooltipContent></Tooltip>
                              <span>₹{Math.round(summary.netProfit).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between text-primary font-bold text-lg"><p>Final Billed Amount:</p> <p>₹{Math.round(summary.billedAmount).toLocaleString('en-IN')}</p></div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>


                  <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (saleToEdit ? "Saving..." : "Creating Sale...") : (saleToEdit ? "Save Changes" : "Create Sale")}</Button>
                  </DialogFooter>
                </form>
            </FormProvider>
          </TooltipProvider>
        </DialogContent>
      </Dialog>
      {isMasterFormOpen && (
        <MasterForm 
            isOpen={isMasterFormOpen} 
            onClose={() => { setIsMasterFormOpen(false); setMasterItemToEdit(null); }} 
            onSubmit={handleMasterFormSubmit}
            initialData={masterItemToEdit}
            itemTypeFromButton={masterFormItemType!}
        />
      )}
    </>
  );
};

export const AddSaleForm = React.memo(AddSaleFormComponent);
____________________________________________________________________
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, RotateCcw, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { isDateInFinancialYear } from "@/lib/utils";
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import type { Sale, SaleReturn, MasterItem, MasterItemType, LedgerEntry } from "@/lib/types";
import { SaleTable } from "@/components/app/sales/SaleTable";
import { AddSaleForm } from "@/components/app/sales/AddSaleForm";
import { SaleChittiPrint } from "@/components/app/sales/SaleChittiPrint";
import { AddSaleReturnForm } from "@/components/app/sales/AddSaleReturnForm";
import { SaleReturnTable } from "@/components/app/sales/SaleReturnTable";
import { renderToStaticMarkup } from 'react-dom/server';

function openPrintWindow(htmlContent: string, title = "Document") {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("Please allow pop-ups to print this document.");
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page {
              size: A5 portrait;
              margin: 10mm;
            }
            body {
              background: white !important;
              color: black !important;
              font-size: 10pt !important;
            }
             .print-chitti-styles { font-family: sans-serif; line-height: 1.4; }
            .print-chitti-styles h1, .print-chitti-styles h2 { margin-top: 0.5em; margin-bottom: 0.25em; }
            .print-chitti-styles table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            .print-chitti-styles th, .print-chitti-styles td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
            .print-chitti-styles th { background-color: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
            .print-chitti-styles .text-right { text-align: right; }
            .print-chitti-styles .font-bold { font-weight: bold; }
            .print-chitti-styles .mt-4 { margin-top: 16px; }
            .print-chitti-styles .mb-2 { margin-bottom: 8px; }
            .print-chitti-styles .flex-between { display: flex; justify-content: space-between; }
            .print-chitti-styles .text-destructive { color: #a12121; }
            .print-chitti-styles .text-green-700 { color: #1d6c4c; }
            .print-chitti-styles .text-red-700 { color: #a12121; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          setTimeout(function() {
            window.print();
            window.close();
          }, 250);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function SalesClient() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  const { sales, saleReturns, setSales, setSaleReturns, isTransactionsLoaded, addOrUpdateMaster } = useTransactions();

  const [isAddSaleFormOpen, setIsAddSaleFormOpen] = React.useState(false);
  const [saleToEdit, setSaleToEdit] = React.useState<Sale | null>(null);

  const [isAddSaleReturnFormOpen, setIsAddSaleReturnFormOpen] = React.useState(false);
  const [saleReturnToEdit, setSaleReturnToEdit] = React.useState<SaleReturn | null>(null);

  const [itemToDelete, setItemToDelete] = React.useState<{ id: string, type: 'sale' | 'return' } | null>(null);
  
  const [activeTab, setActiveTab] = React.useState('sales');

  const openAddSaleForm = React.useCallback(() => {
    setSaleToEdit(null);
    setIsAddSaleFormOpen(true);
  }, []);

  const openAddSaleReturnForm = React.useCallback(() => {
    setSaleReturnToEdit(null);
    setIsAddSaleReturnFormOpen(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.altKey && event.key.toLowerCase() === 'n') {
            const target = event.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (isTyping) return;
            
            event.preventDefault();
            if (activeTab === 'sales') {
                openAddSaleForm();
            } else if (activeTab === 'saleReturns') {
                openAddSaleReturnForm();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, openAddSaleForm, openAddSaleReturnForm]);
  
  const filteredSales = React.useMemo(() => {
    if (isAppHydrating || !isTransactionsLoaded) return [];
    return sales.filter(sale => sale && sale.date && isDateInFinancialYear(sale.date, financialYear) && !sale.isStockPaymentSale);
  }, [sales, financialYear, isAppHydrating, isTransactionsLoaded]);

  const filteredSaleReturns = React.useMemo(() => {
    if (isAppHydrating || !isTransactionsLoaded) return [];
    return saleReturns.filter(sr => sr && sr.date && isDateInFinancialYear(sr.date, financialYear));
  }, [saleReturns, financialYear, isAppHydrating, isTransactionsLoaded]);

  const handleAddOrUpdateSale = React.useCallback((sale: Sale) => {
    const isEditing = sales.some(s => s.id === sale.id);
    setSales(prev => isEditing ? prev.map(s => s.id === sale.id ? sale : s) : [sale, ...prev]);
    setSaleToEdit(null);
    setIsAddSaleFormOpen(false);
    toast({ title: "Success!", description: isEditing ? "Sale updated successfully." : "Sale added successfully." });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [sales, setSales, toast]);

  const handleEditSale = React.useCallback((sale: Sale) => {
    setSaleToEdit(sale);
    setIsAddSaleFormOpen(true);
  }, []);

  const handleDeleteAttempt = React.useCallback((id: string, type: 'sale' | 'return') => {
    setItemToDelete({ id, type });
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'sale') {
      setSales(prev => prev.filter(s => s.id !== itemToDelete.id));
      toast({ title: "Deleted!", description: "Sale record removed.", variant: "destructive" });
    } else {
      setSaleReturns(prev => prev.filter(sr => sr.id !== itemToDelete.id));
      toast({ title: "Deleted!", description: "Sale return record removed.", variant: "destructive" });
    }

    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, setSales, setSaleReturns, toast]);
  
  const handleAddOrUpdateSaleReturn = React.useCallback((srData: SaleReturn) => {
    const isEditing = saleReturns.some(sr => sr.id === srData.id);
    setSaleReturns(prev => isEditing ? prev.map(sr => sr.id === srData.id ? srData : sr) : [srData, ...prev]);
    setSaleReturnToEdit(null);
    setIsAddSaleReturnFormOpen(false);
    toast({ title: "Success!", description: isEditing ? "Sale return updated." : "Sale return added." });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [saleReturns, setSaleReturns, toast]);

  const handleEditSaleReturn = React.useCallback((sr: SaleReturn) => {
    setSaleReturnToEdit(sr);
    setIsAddSaleReturnFormOpen(true);
  }, []);

  const triggerDownloadSalePdf = React.useCallback((sale: Sale) => {
    const chittiHtml = renderToStaticMarkup(<SaleChittiPrint sale={sale} />);
    openPrintWindow(chittiHtml, `SaleChitti_${sale.billNumber || 'Sale'}`);
  }, []);

  const handleMasterDataUpdate = React.useCallback((type: MasterItemType, newItem: MasterItem) => {
    addOrUpdateMaster(newItem);
    toast({ title: `Master list updated for ${type}.` });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [addOrUpdateMaster, toast]);
  
  const addButtonDynamicClass = React.useMemo(() => {
    return activeTab === 'sales' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white';
  }, [activeTab]);

  if (isAppHydrating || !isTransactionsLoaded) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p className="text-lg text-muted-foreground">Loading sales data...</p></div>;

  return (
    <div className="space-y-2 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-2" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase">Sales & Returns (FY {financialYear})</h1>
          <p className="text-muted-foreground text-sm">Press Alt + N to add a new entry to the active tab.</p>
        </div>
      </div>

      <Tabs defaultValue="sales" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="sales" className="py-2.5 text-base rounded-md"><ListChecks className="mr-2 h-5 w-5" />Sales</TabsTrigger>
          <TabsTrigger value="saleReturns" className="py-2.5 text-base rounded-md"><RotateCcw className="mr-2 h-5 w-5" />Sale Returns</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={openAddSaleForm} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <SaleTable data={filteredSales} onEdit={handleEditSale} onDelete={(id) => handleDeleteAttempt(id, 'sale')} onDownloadPdf={triggerDownloadSalePdf} />
        </TabsContent>
        <TabsContent value="saleReturns">
           <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={openAddSaleReturnForm} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Sale Return
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <SaleReturnTable data={filteredSaleReturns} onEdit={handleEditSaleReturn} onDelete={(id) => handleDeleteAttempt(id, 'return')} />
        </TabsContent>
      </Tabs>

      {isAddSaleFormOpen && (
        <AddSaleForm
          key={saleToEdit ? saleToEdit.id : 'new-sale'}
          isOpen={isAddSaleFormOpen}
          onClose={() => setIsAddSaleFormOpen(false)}
          onSubmit={handleAddOrUpdateSale}
          existingSales={sales}
          saleToEdit={saleToEdit}
          onMasterDataUpdate={handleMasterDataUpdate}
        />
      )}
      
      {isAddSaleReturnFormOpen && (
        <AddSaleReturnForm
            key={saleReturnToEdit ? saleReturnToEdit.id : 'new-sale-return'}
            isOpen={isAddSaleReturnFormOpen}
            onClose={() => setIsAddSaleReturnFormOpen(false)}
            onSubmit={handleAddOrUpdateSaleReturn}
            sales={sales}
            existingSaleReturns={saleReturns}
            saleReturnToEdit={saleReturnToEdit}
        />
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete This Record?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this record. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
___________________________________

"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Download } from "lucide-react";
import type { Sale } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTableColumnHeader";

interface SaleTableProps {
  data: Sale[];
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
  onDownloadPdf?: (sale: Sale) => void;
}

const SaleTableComponent: React.FC<SaleTableProps> = ({ data, onEdit, onDelete, onDownloadPdf }) => {

  const columns = React.useMemo<ColumnDef<Sale>[]>(() => [
    {
      accessorKey: 'date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => format(parseISO(row.original.date), "dd/MM/yy"),
    },
    {
      accessorKey: 'billNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bill No." />,
      cell: ({ row }) => row.original.billNumber || 'N/A',
    },
    {
        accessorKey: 'brokerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Broker" />,
        cell: ({ row }) => row.original.brokerName || 'N/A',
    },
    {
        accessorKey: 'customerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    },
    {
        id: 'lots',
        header: 'Vakkal / Lot(s)',
        accessorFn: row => row.items.map(i => i.lotNumber).join(', '),
    },
    {
        accessorKey: 'totalQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bags" className="justify-end"/>,
        cell: ({row}) => <div className="text-right">{Math.round(row.original.totalQuantity).toLocaleString('en-IN')}</div>
    },
    {
        accessorKey: 'totalNetWeight',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Net Wt.(kg)" className="justify-end"/>,
        cell: ({row}) => <div className="text-right">{row.original.totalNetWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
    },
    {
        accessorKey: 'billedAmount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Billed Amt (₹)" className="justify-end"/>,
        cell: ({row}) => <div className="text-right font-semibold">{Math.round(row.original.billedAmount).toLocaleString('en-IN')}</div>
    },
    {
        accessorKey: 'balanceAmount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Balance (₹)" className="justify-end"/>,
        cell: ({row}) => <div className="text-right font-bold text-blue-600">{Math.round(row.original.balanceAmount || 0).toLocaleString('en-IN')}</div>
    },
     {
        accessorKey: 'totalCalculatedProfit',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Profit (₹)" className="justify-end"/>,
        cell: ({row}) => <div className={`text-right font-semibold ${Math.round(row.original.totalCalculatedProfit || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>{Math.round(row.original.totalCalculatedProfit || 0).toLocaleString('en-IN')}</div>
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" /><span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />EDIT</DropdownMenuItem>
            {onDownloadPdf && <DropdownMenuItem onClick={() => onDownloadPdf(row.original)}><Download className="mr-2 h-4 w-4" />DOWNLOAD CHITTI (PDF)</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(row.original.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />DELETE</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onEdit, onDelete, onDownloadPdf]);
  
  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-8 uppercase">NO SALES RECORDED YET.</p>;
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
    />
  );
}

export const SaleTable = React.memo(SaleTableComponent);

