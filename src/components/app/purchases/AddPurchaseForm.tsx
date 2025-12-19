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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Info, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { purchaseSchema, type PurchaseFormValues } from "@/lib/schemas/purchaseSchema";
import type { MasterItem, Purchase, MasterItemType, Agent, ExpenseItem } from "@/lib/types";
import { useTransactions } from "@/hooks/useTransactions";
import { MasterDataCombobox } from "@/components/shared/MasterDataCombobox";
import { useToast } from "@/hooks/use-toast";
import { MasterForm } from "@/components/app/masters/MasterForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (purchase: Purchase) => void;
  purchaseToEdit?: Purchase | null;
}

export const AddPurchaseForm: React.FC<AddPurchaseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseToEdit,
}) => {
  const { toast } = useToast();
  const { masterData, addOrUpdateMaster, getAllMasters } = useTransactions();
  const { Supplier: suppliers = [], Agent: agents = [], Warehouse: warehouses = [], Transporter: transporters = [], Expense: expenses = [] } = masterData;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isMasterFormOpen, setIsMasterFormOpen] = React.useState(false);
  const [masterFormItemType, setMasterFormItemType] = React.useState<MasterItemType | null>(null);
  const [masterItemToEdit, setMasterItemToEdit] = React.useState<MasterItem | null>(null);
  const [manualNetWeight, setManualNetWeight] = React.useState<Record<number, boolean>>({});
  
  const getDefaultValues = React.useCallback((editData?: Purchase | null) => {
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

    const totalExpenses = (formExpenses).reduce((sum, exp) => sum + (exp.amount || 0), 0);
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMasterItemToEdit(null);
    setMasterFormItemType(type);
    setIsMasterFormOpen(true);
  }, []);
  
  const handleEditMasterItem = React.useCallback((type: MasterItemType, id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const allMasters = getAllMasters();
    const itemToEdit = allMasters.find(i => i.id === id) || null;

    if (itemToEdit) {
      setMasterItemToEdit(itemToEdit);
      setMasterFormItemType(type);
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

  const handleLotNumberChange = React.useCallback((index: number, lotNumber: string) => {
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
      toast({ 
        title: "Success", 
        description: purchaseToEdit ? "Purchase updated successfully!" : "Purchase added successfully!" 
      });
      onClose();
    } catch (error) {
      console.error("Error submitting purchase:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save purchase. Please try again.",
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{purchaseToEdit ? 'EDIT PURCHASE' : 'ADD NEW PURCHASE'}</DialogTitle>
            <DialogDescription>
              ENTER THE DETAILS FOR THE PURCHASE RECORD. CLICK SAVE WHEN YOU'RE DONE.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <FormProvider {...formMethods}>
              <form onSubmit={formHandleSubmit(processSubmit)} className="space-y-4 p-1">
                
                {/* Basic Details Section */}
                <div className="p-4 border rounded-md shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-primary">BASIC DETAILS & PARTIES</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* Purchase Date */}
                    <FormField 
                      control={control} 
                      name="date" 
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>PURCHASE DATE</FormLabel>
                          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "dd/MM/yy") : <span>PICK A DATE</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date);
                                    setIsDatePickerOpen(false);
                                  }
                                }}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Supplier */}
                    <FormField 
                      control={control} 
                      name="supplierId" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SUPPLIER</FormLabel>
                          <MasterDataCombobox
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="SELECT SUPPLIER"
                            searchPlaceholder="SEARCH SUPPLIERS..."
                            notFoundMessage="NO SUPPLIER FOUND."
                            addNewLabel="ADD NEW SUPPLIER"
                            onAddNew={() => handleOpenMasterForm("Supplier")}
                            onEdit={(id) => handleEditMasterItem("Supplier", id)}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Agent */}
                    <FormField 
                      control={control} 
                      name="agentId" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AGENT (OPTIONAL)</FormLabel>
                          <MasterDataCombobox
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            options={agents.map(a => ({ value: a.id, label: a.name }))}
                            placeholder="SELECT AGENT"
                            searchPlaceholder="SEARCH AGENTS..."
                            notFoundMessage="NO AGENT FOUND."
                            addNewLabel="ADD NEW AGENT"
                            onAddNew={() => handleOpenMasterForm("Agent")}
                            onEdit={(id) => handleEditMasterItem("Agent", id)}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Location */}
                    <FormField 
                      control={control} 
                      name="locationId" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LOCATION (WAREHOUSE)</FormLabel>
                          <MasterDataCombobox
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                            placeholder="SELECT LOCATION"
                            searchPlaceholder="SEARCH LOCATIONS..."
                            notFoundMessage="NO LOCATION FOUND."
                            addNewLabel="ADD NEW LOCATION"
                            onAddNew={() => handleOpenMasterForm("Warehouse")}
                            onEdit={(id) => handleEditMasterItem("Warehouse", id)}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="p-4 border rounded-md shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-primary">ITEMS</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border-b last:border-b-0">
                      
                      {/* Lot Number */}
                      <FormField 
                        control={control} 
                        name={`items.${index}.lotNumber`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>VAKKAL/LOT NO.</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="E.G., AB/6 OR BU-5"
                                {...itemField}
                                onChange={(e) => handleLotNumberChange(index, e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Quantity */}
                      <FormField 
                        control={control} 
                        name={`items.${index}.quantity`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>BAGS</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                placeholder="BAGS"
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
                      
                      {/* Net Weight */}
                      <FormField 
                        control={control} 
                        name={`items.${index}.netWeight`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>NET WT.</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="KG"
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
                      
                      {/* Rate */}
                      <FormField 
                        control={control} 
                        name={`items.${index}.rate`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>RATE</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="₹/KG"
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
                      
                      {/* Goods Value (Calculated) */}
                      <div className="md:col-span-2">
                        <FormLabel>GOODS VALUE (₹)</FormLabel>
                        <div className="font-medium text-sm h-10 flex items-center px-3 border border-dashed rounded-md bg-muted/50 text-foreground/80">
                          {Math.round(summary.itemsWithLandedCost[index]?.goodsValue || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
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
                      <PlusCircle className="mr-2 h-4 w-4" /> ADD ITEM
                    </Button>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="p-4 border rounded-md shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-primary">EXPENSES</h3>
                  {expenseFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border-b last:border-b-0">
                      
                      {/* Account */}
                      <FormField 
                        control={control} 
                        name={`expenses.${index}.account`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Account</FormLabel>
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
                      
                      {/* Amount */}
                      <FormField 
                        control={control} 
                        name={`expenses.${index}.amount`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Amount"
                                {...itemField}
                                value={itemField.value ?? ''}
                                onChange={e => {
                                  const amount = e.target.value ? parseFloat(e.target.value) : undefined;
                                  itemField.onChange(amount);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Party */}
                      <FormField 
                        control={control} 
                        name={`expenses.${index}.partyId`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Party (Optional)</FormLabel>
                            <MasterDataCombobox
                              value={itemField.value}
                              onChange={(value) => itemField.onChange(value)}
                              options={getAllMasters().map(p => ({ 
                                value: p.id, 
                                label: `${p.name} (${p.type})` 
                              }))}
                              placeholder="Select Party"
                              searchPlaceholder="Search parties..."
                              notFoundMessage="No party found."
                              addNewLabel="Add New Party"
                              onAddNew={() => handleOpenMasterForm("Transporter")}
                              onEdit={(id) => handleEditMasterItem("Transporter", id)}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Payment Mode */}
                      <FormField 
                        control={control} 
                        name={`expenses.${index}.paymentMode`} 
                        render={({ field: itemField }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Payment Mode</FormLabel>
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
                      
                      {/* Delete Button */}
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

                {/* Summary Section */}
                <div className="p-4 border border-dashed rounded-md bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between text-md font-semibold">
                    <span>GOODS VALUE:</span>
                    <p>₹{Math.round(summary.totalGoodsValue).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center justify-between text-md font-semibold">
                    <span>TOTAL EXPENSES:</span>
                    <p>₹{Math.round(summary.totalExpenses).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 mt-2">
                    <div className="flex items-center text-lg font-semibold text-primary">
                      <Info className="w-5 h-5 mr-2" />
                      TOTAL PURCHASE VALUE:
                    </div>
                    <p className="text-xl font-bold text-primary">
                      ₹{Math.round(summary.totalAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  {summary.totalNetWeight > 0 && summary.itemsWithLandedCost.length > 0 && (
                    <div className="pt-4 border-t mt-4">
                      <h4 className="font-semibold mb-2 text-muted-foreground">
                        PER-VAKKAL LANDED COST
                      </h4>
                      <ScrollArea className="h-24">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>VAKKAL</TableHead>
                              <TableHead className="text-right">LANDED COST (₹/KG)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {summary.itemsWithLandedCost.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.lotNumber || `ITEM ${index + 1}`}</TableCell>
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

                {/* Form Actions */}
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={onClose}>
                      CANCEL
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (purchaseToEdit ? "SAVING..." : "ADDING...") 
                      : (purchaseToEdit ? "SAVE CHANGES" : "ADD PURCHASE")
                    }
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Master Form Modal */}
      {isMasterFormOpen && masterFormItemType && (
        <MasterForm
          isOpen={isMasterFormOpen}
          onClose={() => {
            setIsMasterFormOpen(false);
            setMasterItemToEdit(null);
            setMasterFormItemType(null);
          }}
          onSubmit={handleMasterFormSubmit}
          initialData={masterItemToEdit}
          itemTypeFromButton={masterFormItemType}
        />
      )}
    </>
  );
};
