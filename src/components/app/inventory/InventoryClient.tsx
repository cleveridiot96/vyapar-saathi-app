"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, Package, AlertTriangle } from "lucide-react";
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
import { useTransactions, useMasters } from "@/hooks/useTransactions";
import type { StockAdjustment, MasterItem } from "@/lib/types";
import { useInventory } from "@/hooks/useInventory";
import dynamic from 'next/dynamic';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const LowStockWarning = dynamic(() => import('@/components/app/dashboard/LowStockWarning').then(mod => mod.LowStockWarning), { 
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />
});
const AddAdjustmentForm = dynamic(() => import('@/components/app/stock-adjustments/AddAdjustmentForm').then(mod => mod.AddAdjustmentForm), { 
    ssr: false,
    loading: () => <p>Loading form...</p>
});

export function InventoryClient() {
  const { toast } = useToast();
  const { financialYear } = useSettings();
  
  const { 
    adjustments, 
    addAdjustment,
    purchases,
    locationTransfers
  } = useTransactions();
  
  const { masterData } = useMasters();
  
  const { allAggregatedInventory, isLoading: isInventoryLoading } = useInventory();

  const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = React.useState(false);
  const [adjustmentToEdit, setAdjustmentToEdit] = React.useState<StockAdjustment | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('stock');

  const filteredInventory = React.useMemo(() => {
    if (isInventoryLoading) return [];
    return (allAggregatedInventory ?? []).filter(item => {
        if (!item.purchaseDate) return true;
        return isDateInFinancialYear(item.purchaseDate, financialYear);
    });
  }, [allAggregatedInventory, financialYear, isInventoryLoading]);

  const allLotsInSystem = React.useMemo(() => {
    const lots = new Set<string>();
    (purchases ?? []).forEach(p => p.items.forEach(i => lots.add(i.lotNumber)));
    (locationTransfers ?? []).forEach(t => t.items.forEach(i => {
        lots.add(i.originalLotNumber);
        lots.add(i.newLotNumber);
    }));
    return Array.from(lots).sort();
  }, [purchases, locationTransfers]);

  const handleAddAdjustment = React.useCallback((adjustment: Omit<StockAdjustment, 'id'>) => {
    addAdjustment({ ...adjustment, id: `adj-${Date.now()}` });
    setIsAdjustmentFormOpen(false);
    toast({ title: "Success!", description: "Stock adjustment added." });
    window.dispatchEvent(new CustomEvent("reindex-search"));
  }, [addAdjustment, toast]);

  const handleDeleteAttempt = React.useCallback((id: string) => {
    setItemToDelete(id);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!itemToDelete) return;
    // setAdjustments(prev => prev.filter(adj => adj.id !== itemToDelete));
    toast({ title: "Delete not implemented", description: "This is a prototype", variant: "destructive" });
    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, toast]);

  const triggerLowStockWarning = React.useCallback(() => {
    toast({ title: "Stock Check", description: "Checking stock levels..." });
  }, [toast]);
  
  const addButtonDynamicClass = React.useMemo(() => {
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  }, []);

  if (isInventoryLoading) {
      return (
          <div className="space-y-4 p-4">
              <div className="flex justify-between items-center">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-[calc(100vh-15rem)] w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-2 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-2" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 no-print">
        <h1 className="text-2xl font-bold text-foreground uppercase">Inventory Management (FY {financialYear})</h1>
      </div>

      <Tabs defaultValue="stock" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="stock" className="py-2.5 text-base rounded-md"><Package className="mr-2 h-5 w-5" />Stock Overview</TabsTrigger>
          <TabsTrigger value="adjustments" className="py-2.5 text-base rounded-md"><RotateCcw className="mr-2 h-5 w-5" />Adjustments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button variant="outline" size="sm" onClick={triggerLowStockWarning}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Check Low Stock
            </Button>
          </div>

          <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Item Name / Lot</TableHead>
                  <TableHead className="text-right">Current Stock (Kg)</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Avg Rate</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <TableRow key={item.key} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{format(parseISO(item.purchaseDate || new Date().toISOString()), "dd-MM-yyyy")}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.lotNumber}</div>
                        {item.currentBags < 50 && <Badge variant="destructive" className="ml-2 text-[10px]">Low</Badge>}
                      </TableCell>
                      <TableCell className="text-right">{Math.round(item.currentWeight || 0).toLocaleString()}</TableCell>
                      <TableCell>{item.locationName}</TableCell>
                      <TableCell>
                         <Badge variant={item.currentWeight > 0 ? "secondary" : "outline"}>
                            {item.currentWeight > 0 ? "In Stock" : "Out of Stock"}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{Math.round(item.effectiveRate || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">₹{Math.round(item.cogs || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No inventory data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="adjustments">
           <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setAdjustmentToEdit(null); setIsAdjustmentFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
              <Plus className="mr-2 h-4 w-4" /> Add Adjustment
            </Button>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Stock Adjustments List Component should go here.
            <p className="text-sm mt-2">
               (State adjustments: {adjustments?.length || 0})
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {isAdjustmentFormOpen && (
        <AddAdjustmentForm
          isOpen={isAdjustmentFormOpen}
          onClose={() => setIsAdjustmentFormOpen(false)}
          onSubmit={handleAddAdjustment}
          warehouses={(masterData.Warehouse ?? [])}
          availableLots={allLotsInSystem}
        />
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this record. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
