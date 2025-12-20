
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Info, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { purchaseSchema, type PurchaseFormValues } from "@/lib/schemas/purchaseSchema";
import type { MasterItem, Purchase, MasterItemType, Agent, ExpenseItem } from "@/lib/types";
import { MasterDataCombobox } from "@/components/shared/MasterDataCombobox";
import { useToast } from "@/hooks/use-toast";
import { MasterForm } from "@/components/app/masters/MasterForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { useTransactions } from "@/hooks/useTransactions";

interface AddPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (purchase: Purchase) => void;
  purchaseToEdit?: Purchase | null;
  masterData: {
      Customer: MasterItem[];
      Supplier: MasterItem[];
      Agent: MasterItem[];
      Transporter: MasterItem[];
      Warehouse: MasterItem[];
      Broker: MasterItem[];
      Expense: MasterItem[];
  };
  addOrUpdateMaster: (item: MasterItem) => void;
  getAllMasters: () => MasterItem[];
}

export const AddPurchaseForm: React.FC<AddPurchaseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseToEdit,
  masterData,
  addOrUpdateMaster,
  getAllMasters
}) => {
  const { toast } = useToast();
  const { purchases, locationTransfers } = useTransactions();
  const { Supplier: suppliers = [], Agent: agents = [], Warehouse: warehouses = [], Transporter: transporters = [], Expense: expenses = [] } = masterData;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
  const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);
  const [masterItemToEdit, setMasterItemToEdit] = React.useState<MasterItem | null>(null);
  const [manualNetWeight, setManualNetWeight] = React.useState<Record<number, boolean>>({});
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const allSystemLots = React.useMemo(() => {
    const lots = new Set<string>();
    purchases.forEach(p => p.items.forEach(i => lots.add(i.lotNumber)));
    locationTransfers.forEach(lt => {
      lt.items.forEach(item => {
        lots.add(item.originalLotNumber);
        lots.add(item.newLotNumber);
      });
    });
    return Array.from(lots).sort().map(lot => ({ value: lot, label: lot }));
  }, [purchases, locationTransfers]);

  const getDefaultValues = React.useCallback((editData?: Purchase | null): PurchaseFormValues => {
    if (editData) {
      return {
        date: new Date(editData.date),
        locationId: editData.locationId,
        supplierId: editData.supplierId,
        agentId: editData.agentId || undefined,
        transporterId: editData.transporterId || undefined,
        items: editData.items.map(item => ({
          lotNumber: item.lotNumber,
          quantity: item.quantity,
          netWeight: item.netWeight,
          rate: item.rate
        })),
        expenses: editData.expenses || [],
      };
    }
    return {
      date: new Date(),
      locationId: undefined,
      supplierId: undefined,
      agentId: undefined,
      transporterId: undefined,
      items: [{ lotNumber: "", quantity: undefined, netWeight: undefined, rate: undefined }],
      expenses: [],
    };
  }, []);

  const formMethods = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: getDefaultValues(purchaseToEdit),
    mode: 'onChange',
  });

  const { control, watch, setValue, handleSubmit: formHandleSubmit, formState: { errors }, reset } = formMethods;

  React.useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(purchaseToEdit));
      setManualNetWeight({});
    }
  }, [isOpen, purchaseToEdit, reset, getDefaultValues]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({ control, name: "expenses" });

  const watchedFormValues = watch();
  
  const summary = React.useMemo(() => {
    const { items, expenses: formExpenses = [] } = watchedFormValues;

    let totalGoodsValue = 0;
    let totalNetWeight = 0;
    let totalQuantity = 0;

    const itemsWithGoodsValue = (items || []).map(item => {
      const netWeight = Number(item.netWeight) || 0;
      const rate = Number(item.rate) || 0;
      const quantity = Number(item.quantity) || 0;
      const goodsValue = netWeight * rate;
      totalGoodsValue += goodsValue;
      totalNetWeight += netWeight;
      totalQuantity += quantity;
      return { ...item, goodsValue };
    });

    const totalExpenses = formExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalAmount = totalGoodsValue + totalExpenses;
    const expensesPerKg = totalNetWeight > 0 ? totalExpenses / totalNetWeight : 0;
    
    const itemsWithLandedCost = itemsWithGoodsValue.map(item => {
      const itemRate = Number(item.rate) || 0;
      const landedCostPerKg = itemRate + expensesPerKg;
      return { ...item, landedCostPerKg: parseFloat(landedCostPerKg.toFixed(2)) };
    });

    return {
      totalGoodsValue,
      totalExpenses,
      totalAmount,
      totalNetWeight,
      totalQuantity,
      itemsWithLandedCost,
    };
  }, [watchedFormValues]);

  const handleOpenMasterForm = React.useCallback((type: MasterItemType, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMasterItemToEdit(null);
    setMasterFormItemType(type);
    setIsMasterFormOpen(true);
  }, []);
  
  const handleEditMasterItem = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const allMasters = getAllMasters();
    const itemToEdit = allMasters.find(i => i.id === id) || null;

    if (itemToEdit) {
      setMasterItemToEdit(itemToEdit);
      setMasterFormItemType(itemToEdit.type);
      setIsMasterFormOpen(true);
    }
  }, [getAllMasters]);

  const handleMasterFormSubmit = React.useCallback((newItem: MasterItem) => {
    addOrUpdateMaster(newItem);
    
    if (newItem.type === 'Supplier') {
      setValue('supplierId', newItem.id, { shouldValidate: true, shouldDirty: true });
    } else if (newItem.type === 'Agent') {
      setValue('agentId', newItem.id, { shouldValidate: true, shouldDirty: true });
    } else if (newItem.type === 'Warehouse') {
      setValue('locationId', newItem.id, { shouldValidate: true, shouldDirty: true });
    } else if (newItem.type === 'Transporter') {
      setValue('transporterId', newItem.id, { shouldValidate: true, shouldDirty: true });
    }
    
    setIsMasterFormOpen(false);
    setMasterFormItemType(null);
    setMasterItemToEdit(null);
    
    toast({ 
      title: "Success", 
      description: `${newItem.type} "${newItem.name}" added/updated successfully!` 
    });
  }, [addOrUpdateMaster, setValue, toast]);

  const handleLotNumberChange = React.useCallback((index: number, lotNumber: string | undefined) => {
    if (!lotNumber) return;
    setValue(`items.${index}.lotNumber`, lotNumber, { shouldValidate: true });
    
    const match = lotNumber.match(/[/\s\-.,;](\d+)$/);
    if (match && match[1]) {
      const bags = parseInt(match[1], 10);
      if (!isNaN(bags) && bags > 0) {
        setValue(`items.${index}.quantity`, bags, { shouldValidate: true });
        if (!manualNetWeight[index]) {
          setValue(`items.${index}.netWeight`, bags * 50, { shouldValidate: true });
        }
      }
    }
  }, [setValue, manualNetWeight]);

  const handleQuantityChange = React.useCallback((index: number, bags: number | undefined) => {
    setValue(`items.${index}.quantity`, bags, { shouldValidate: true });
    if (!manualNetWeight[index] && bags) {
      setValue(`items.${index}.netWeight`, bags * 50, { shouldValidate: true });
    }
  }, [setValue, manualNetWeight]);

  const handleNetWeightChange = React.useCallback((index: number, weight: number | undefined) => {
    setManualNetWeight(prev => ({ ...prev, [index]: true }));
    setValue(`items.${index}.netWeight`, weight, { shouldValidate: true });
  }, [setValue]);

   const handleManualRefresh = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRefreshing(true);
    window.dispatchEvent(new Event('reindex-search'));
    toast({ title: "Refreshed", description: "Master data re-synced." });
    setIsRefreshing(false);
  };

  const processSubmit = React.useCallback((values: PurchaseFormValues) => {
    setIsSubmitting(true);
    try {
      const totalAmount = Math.round(summary.totalAmount);
      const effectiveRate = summary.totalNetWeight > 0 ? totalAmount / summary.totalNetWeight : 0;

      const purchaseData: Purchase = {
        id: purchaseToEdit?.id || `purchase-${Date.now()}`,
        date: format(values.date, "yyyy-MM-dd"),
        locationId: values.locationId as string,
        locationName: warehouses.find(w => w.id === values.locationId)?.name || 'Unknown Location',
        supplierId: values.supplierId as string,
        supplierName: suppliers.find(s => s.id === values.supplierId)?.name || 'Unknown Supplier',
        agentId: values.agentId,
        agentName: agents.find(a => a.id === values.agentId)?.name,
        transporterId: values.transporterId,
        transporterName: transporters.find(t => t.id === values.transporterId)?.name,
        items: summary.itemsWithLandedCost.map(item => ({
          id: `pitem-${Date.now()}-${Math.random()}`,
          lotNumber: item.lotNumber,
          category: 'default',
          quantity: Math.round(item.quantity || 0),
          netWeight: item.netWeight || 0,
          rate: item.rate || 0,
          goodsValue: Math.round(item.goodsValue || 0),
          landedCostPerKg: item.landedCostPerKg,
        })),
        expenses: values.expenses?.map(exp => ({
          ...exp,
          id: exp.id || `exp-${Date.now()}-${Math.random()}`,
          partyName: getAllMasters().find(p => p.id === exp.partyId)?.name || exp.partyName,
        })) as ExpenseItem[],
        totalGoodsValue: Math.round(summary.totalGoodsValue),
        totalQuantity: Math.round(summary.totalQuantity),
        totalNetWeight: summary.totalNetWeight,
        totalAmount,
        effectiveRate,
      };
      
      console.log('🔵 FORM: About to call onSubmit with:', purchaseData);
      onSubmit(purchaseData);
      console.log('🟢 FORM: onSubmit called successfully');

      onClose();
    } catch (error) {
      console.error('🔴 FORM ERROR:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [summary, purchaseToEdit, warehouses, suppliers, agents, transporters, getAllMasters, onSubmit, onClose, toast]);
  
  const isLastItemValid = React.useMemo(() => {
    const lastItem = watchedFormValues.items?.[watchedFormValues.items.length - 1];
    return lastItem && lastItem.lotNumber && lastItem.quantity && lastItem.netWeight && lastItem.rate;
  }, [watchedFormValues.items]);

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen && !isMasterFormOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
             <div className="flex items-start justify-between">
                <div>
                    <DialogTitle>{purchaseToEdit ? 'Edit Purchase' : 'Add New Purchase'}</DialogTitle>
                    <DialogDescription>
                    Enter the details for the purchase record. Click Save when you're done.
                    </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleManualRefresh} disabled={isRefreshing} className="-mt-1">
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 pb-6">
              <FormProvider {...formMethods}>
                <form onSubmit={formHandleSubmit(processSubmit)} className="space-y-4 pt-4">
                  
                  <div className="p-4 border rounded-md shadow-sm">
                    <h3 className="text-lg font-medium mb-3 text-primary">Basic Details & Parties</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <FormField
                          control={control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Purchase Date</FormLabel>
                              <DatePicker
                                date={field.value}
                                onDateChange={field.onChange}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <FormField 
                        control={control} 
                        name="supplierId" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier <span className="text-destructive">*</span></FormLabel>
                            <MasterDataCombobox
                              value={field.value}
                              onChange={field.onChange}
                              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                              placeholder="Select Supplier"
                              searchPlaceholder="Search Suppliers..."
                              notFoundMessage="No Supplier found."
                              addNewLabel="Add New Supplier"
                              onAddNew={(e) => handleOpenMasterForm("Supplier", e)}
                              onEdit={(id, e) => handleEditMasterItem(id, e)}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField 
                        control={control} 
                        name="agentId" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent</FormLabel>
                            <MasterDataCombobox
                              value={field.value}
                              onChange={field.onChange}
                              options={agents.map(a => ({ value: a.id, label: a.name }))}
                              placeholder="Select Agent"
                              searchPlaceholder="Search Agents..."
                              notFoundMessage="No Agent found."
                              addNewLabel="Add New Agent"
                              onAddNew={(e) => handleOpenMasterForm("Agent", e)}
                              onEdit={(id, e) => handleEditMasterItem(id, e)}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField 
                        control={control} 
                        name="locationId" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location <span className="text-destructive">*</span></FormLabel>
                            <MasterDataCombobox
                              value={field.value}
                              onChange={field.onChange}
                              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                              placeholder="Select Location"
                              searchPlaceholder="Search Locations..."
                              notFoundMessage="No Location found."
                              addNewLabel="Add New Location"
                              onAddNew={(e) => handleOpenMasterForm("Warehouse", e)}
                              onEdit={(id, e) => handleEditMasterItem(id, e)}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="p-4 border rounded-md shadow-sm">
                    <h3 className="text-lg font-medium mb-3 text-primary">Items</h3>
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border-b last:border-b-0">
                        
                        <FormField 
                          control={control} 
                          name={`items.${index}.lotNumber`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Vakkal/Lot No. <span className="text-destructive">*</span></FormLabel>
                              <MasterDataCombobox
                                value={itemField.value}
                                onChange={(value) => handleLotNumberChange(index, value)}
                                options={allSystemLots}
                                placeholder="E.g., AV/5 or select"
                                searchPlaceholder="Search existing lots..."
                                notFoundMessage="No lot found."
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField 
                          control={control} 
                          name={`items.${index}.quantity`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Bags <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="1"
                                  placeholder="Bags"
                                  {...itemField}
                                  value={itemField.value ?? ''}
                                  onChange={e => {
                                    const bags = e.target.value ? parseFloat(e.target.value) : undefined;
                                    handleQuantityChange(index, bags);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField 
                          control={control} 
                          name={`items.${index}.netWeight`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Net Wt. <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Kg"
                                  {...itemField}
                                  value={itemField.value ?? ''}
                                  onChange={e => {
                                    const weight = e.target.value ? parseFloat(e.target.value) : undefined;
                                    handleNetWeightChange(index, weight);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField 
                          control={control} 
                          name={`items.${index}.rate`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Rate <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="₹/Kg"
                                  {...itemField}
                                  value={itemField.value ?? ''}
                                  onChange={e => {
                                    const rate = e.target.value ? parseFloat(e.target.value) : undefined;
                                    itemField.onChange(rate);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="md:col-span-2">
                          <FormLabel>Goods Value (₹)</FormLabel>
                          <div className="font-medium text-sm h-10 flex items-center px-3 border border-dashed rounded-md bg-muted/50 text-foreground/80">
                            {Math.round(summary.itemsWithLandedCost[index]?.goodsValue || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        
                        <div className="md:col-span-1 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-start mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ lotNumber: "", quantity: undefined, netWeight: undefined, rate: undefined })}
                        disabled={!isLastItemValid}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md shadow-sm">
                    <h3 className="text-lg font-medium mb-3 text-primary">Expenses</h3>
                    {expenseFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border-b last:border-b-0">
                        
                        <FormField 
                          control={control} 
                          name={`expenses.${index}.account`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Account <span className="text-destructive">*</span></FormLabel>
                              <Select 
                                onValueChange={itemField.onChange} 
                                value={itemField.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {expenses.map(opt => (
                                    <SelectItem key={opt.id} value={opt.name}>
                                      {opt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField 
                          control={control} 
                          name={`expenses.${index}.amount`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Amount (₹) <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Amount"
                                  {...itemField}
                                  value={itemField.value ?? ''}
                                  onChange={e => itemField.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField 
                          control={control} 
                          name={`expenses.${index}.partyId`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Party</FormLabel>
                              <MasterDataCombobox
                                value={itemField.value}
                                onChange={itemField.onChange}
                                options={getAllMasters().map(p => ({ 
                                  value: p.id, 
                                  label: `${p.name} (${p.type})` 
                                }))}
                                placeholder="Select Party"
                                searchPlaceholder="Search parties..."
                                notFoundMessage="No party found."
                                addNewLabel="Add New Party"
                                onAddNew={(e) => handleOpenMasterForm("Transporter", e)}
                                onEdit={(id, e) => handleEditMasterItem(id, e)}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField 
                          control={control} 
                          name={`expenses.${index}.paymentMode`} 
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Payment Mode <span className="text-destructive">*</span></FormLabel>
                              <Select 
                                onValueChange={itemField.onChange} 
                                value={itemField.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Mode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="Bank">Bank</SelectItem>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="md:col-span-1 flex items-center justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeExpense(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendExpense({ 
                        id: `exp-${Date.now()}`, 
                        account: '', 
                        amount: 0, 
                        paymentMode: "Cash" 
                      })}
                      className="mt-3"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Expense Row
                    </Button>
                  </div>

                  <div className="p-4 border border-dashed rounded-md bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between text-md font-semibold">
                      <span>Goods Value:</span>
                      <p>₹{Math.round(summary.totalGoodsValue).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center justify-between text-md font-semibold">
                      <span>Total Expenses:</span>
                      <p>₹{Math.round(summary.totalExpenses).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                      <div className="flex items-center text-lg font-semibold text-primary">
                        <Info className="w-5 h-5 mr-2" />
                        Total Purchase Value:
                      </div>
                      <p className="text-xl font-bold text-primary">
                        ₹{Math.round(summary.totalAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                    
                    {summary.totalNetWeight > 0 && summary.itemsWithLandedCost.length > 0 && (
                      <div className="pt-4 border-t mt-4">
                        <h4 className="font-semibold mb-2 text-muted-foreground">
                          Per-Vakkal Landed Cost
                        </h4>
                        <ScrollArea className="h-24">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Vakkal</TableHead>
                                <TableHead className="text-right">Landed Cost (₹/Kg)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {summary.itemsWithLandedCost.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.lotNumber || `Item ${index + 1}`}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    ₹{Math.round(item.landedCostPerKg || 0).toLocaleString('en-IN')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    )}
                  </div>

                </form>
              </FormProvider>
              </div>
          </div>
           <DialogFooter className="p-6 pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
              <Button type="button" onClick={formHandleSubmit(processSubmit)} disabled={isSubmitting}>
                {isSubmitting 
                  ? (purchaseToEdit ? "Saving..." : "Adding...") 
                  : (purchaseToEdit ? "Save Changes" : "Add Purchase")
                }
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMasterFormOpen && masterFormItemType && (
        <MasterForm
          isOpen={isMasterFormOpen}
          onClose={() => {
            setIsMasterFormOpen(false);
            setMasterItemToEdit(null);
          }}
          onSubmit={handleMasterFormSubmit}
          initialData={masterItemToEdit}
          itemTypeFromButton={masterFormItemType}
        />
      )}
    </>
  );
};
