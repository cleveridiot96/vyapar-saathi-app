
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import { purchaseSchema } from "@/lib/schemas/purchaseSchema";
import type { Purchase, MasterItem, MasterItemType, ExpenseItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { MasterDataCombobox } from "@/components/shared/MasterDataCombobox";
import { Info, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { MasterForm } from "@/components/app/masters/MasterForm";

// --- 1. MAIN PAGE COMPONENT ---
export default function PurchasesPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Handle Saving from the Form
  const handlePurchaseSubmit = (purchase: Purchase) => {
    if (editingPurchase) {
      dispatch.updatePurchase(purchase);
    } else {
      dispatch.addPurchase(purchase);
    }
    setIsPurchaseFormOpen(false);
    setEditingPurchase(null);
  };

  const handleEditClick = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsPurchaseFormOpen(true);
  };
  
  const handleDeleteClick = (purchase: Purchase) => {
    // Add deletion logic here, likely involving a confirmation dialog
    console.log("Delete clicked for", purchase.id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 border-b bg-white gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/purchases/returns">
            <Button variant="outline" size="sm" className="h-9">
              Purchase Returns
            </Button>
          </Link>
          <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700" onClick={() => { setEditingPurchase(null); setIsPurchaseFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Purchase
          </Button>
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party / Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.purchases.length > 0 ? (
                  state.purchases.map((purchase: any) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(parseISO(purchase.date), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{purchase.invoiceNo || purchase.id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplierName || purchase.partyName || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.locationName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        ₹{Number(purchase.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(purchase)}>Edit</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-lg font-medium text-gray-900">No purchases recorded yet.</p>
                      <p className="text-sm text-gray-500">Click "New Purchase" to add your first entry.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>Total: {state.purchases.length} entries</span>
          </div>
        </div>
      </div>

      {isPurchaseFormOpen && <AddPurchaseForm
        isOpen={isPurchaseFormOpen}
        onClose={() => { setIsPurchaseFormOpen(false); setEditingPurchase(null); }}
        onSubmit={handlePurchaseSubmit}
        purchaseToEdit={editingPurchase}
        masterData={state.masterData}
        addOrUpdateMaster={dispatch.addOrUpdateMaster}
        getAllMasters={state.getAllMasters}
      />}
    </div>
  );
}

// --- 2. PURCHASE FORM COMPONENT ---
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface AddPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (purchase: Purchase) => void;
  purchaseToEdit?: Purchase | null;
  masterData: AppState['masterData'];
  addOrUpdateMaster: (item: MasterItem) => void;
  getAllMasters: () => MasterItem[];
}

const AddPurchaseForm: React.FC<AddPurchaseFormProps> = ({
  isOpen, onClose, onSubmit, purchaseToEdit, masterData, addOrUpdateMaster, getAllMasters
}) => {
    const { toast } = useToast();
    const { Supplier: suppliers = [], Agent: agents = [], Warehouse: warehouses = [], Transporter: transporters = [], Expense: expenses = [] } = masterData;
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
    const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);
    const [masterItemToEdit, setMasterItemToEdit] = React.useState<MasterItem | null>(null);
    const [manualNetWeight, setManualNetWeight] = React.useState<Record<number, boolean>>({});
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    
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
        
        onSubmit(purchaseData);
  
        onClose();
      } catch (error) {
        console.error('FORM ERROR:', error);
        toast({ 
          title: "Error", 
          description: "Failed to save purchase. Please check console for details.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [summary, purchaseToEdit, warehouses, suppliers, agents, transporters, getAllMasters, onSubmit, onClose, toast]);
    
  
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
                                 <FormControl>
                                  <Input
                                    placeholder="E.g., AV/5"
                                    {...itemField}
                                    onChange={(e) => handleLotNumberChange(index, e.target.value)}
                                  />
                                </FormControl>
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
            allMasterItems={getAllMasters()}
            fixedIds={[]}
          />
        )}
      </>
    );
  };

    