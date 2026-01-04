
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, ListChecks, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { isDateInFinancialYear } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTransactions, useMasters } from "@/hooks/useTransactions";
import type { Sale, SaleReturn } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import { DatabaseDiagnostic } from "@/components/DatabaseDiagnostic";
import { TestDataSeeder } from "@/components/TestDataSeeder";
import { Skeleton } from "@/components/ui/skeleton";

const SaleTable = dynamic(() => import('./SaleTable').then(mod => mod.SaleTable), { ssr: false });
const AddSaleForm = dynamic(() => import('./AddSaleForm').then(mod => mod.AddSaleForm), { ssr: false });
const SaleReturnTable = dynamic(() => import('./SaleReturnTable').then(mod => mod.SaleReturnTable), { ssr: false });

export function SalesClient() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  
  const { 
      sales, 
      addSale, 
      updateSale, 
      deleteSale, 
      saleReturns, 
      isTransactionsLoaded 
  } = useTransactions();
  
  const { isMastersLoaded } = useMasters();

  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [saleToEdit, setSaleToEdit] = React.useState<Sale | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'sale' | 'return'} | null>(null);
  const [activeTab, setActiveTab] = React.useState('sales');
  
  const filteredSales = React.useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return (sales || []).filter(s => s && s.date && isDateInFinancialYear(s.date, financialYear));
  }, [sales, financialYear, isTransactionsLoaded]);

  const filteredSaleReturns = React.useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return (saleReturns || []).filter(sr => sr && sr.date && isDateInFinancialYear(sr.date, financialYear));
  }, [saleReturns, financialYear, isTransactionsLoaded]);


  const handleAddOrUpdateSale = React.useCallback((sale: Sale) => {
    const isEditing = (sales || []).some(s => s.id === sale.id);
    
    if (isEditing) {
      updateSale(sale);
      toast({ title: "Sale updated!" });
    } else {
      addSale(sale);
      toast({ title: "Sale added!" });
    }
    
    setSaleToEdit(null);
    setIsAddFormOpen(false);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [sales, addSale, updateSale, toast]);

  const confirmDelete = React.useCallback(async () => {
    if (!itemToDelete) return;
    
    if(itemToDelete.type === 'sale') {
      await deleteSale(itemToDelete.id);
      toast({ title: "Sale deleted!", variant: "destructive" });
    }
    
    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, deleteSale, toast]);

  const addButtonClass = activeTab === 'sales' 
    ? 'bg-green-600 hover:bg-green-700 text-white' 
    : 'bg-orange-600 hover:bg-orange-700 text-white';

  if (!isTransactionsLoaded || !isMastersLoaded || isAppHydrating) {
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
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold uppercase">Sales & Returns (FY {financialYear})</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DatabaseDiagnostic />
        <TestDataSeeder />
      </div>

      <Tabs defaultValue="sales" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="sales" className="py-2.5 text-base rounded-md"><ListChecks className="mr-2 h-5 w-5" />Sales</TabsTrigger>
          <TabsTrigger value="returns" className="py-2.5 text-base rounded-md"><RotateCcw className="mr-2 h-5 w-5" />Sale Returns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
           <div className="flex justify-end gap-2">
             <Button onClick={() => { setSaleToEdit(null); setIsAddFormOpen(true); }} className={cn(addButtonClass, "text-base py-2 px-5 shadow-md")}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
             </Button>
           </div>
          
           <div className="text-sm text-muted-foreground mb-2">
              Showing {filteredSales.length} sale(s)
           </div>
          
          <SaleTable 
            data={filteredSales} 
            onEdit={(s) => { setSaleToEdit(s); setIsAddFormOpen(true); }}
            onDelete={(id) => setItemToDelete({ id, type: 'sale' })} 
          />
        </TabsContent>
        
        <TabsContent value="returns">
          <SaleReturnTable 
            data={filteredSaleReturns} 
            onEdit={() => {}}
            onDelete={() => {}} 
          />
        </TabsContent>
      </Tabs>

      {isAddFormOpen && (
        <AddSaleForm
          isOpen={isAddFormOpen}
          onClose={() => {setIsAddFormOpen(false); setSaleToEdit(null);}}
          onSubmit={handleAddOrUpdateSale}
          existingSales={sales || []}
          saleToEdit={saleToEdit}
        />
      )}

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Delete</AlertDialogTitle><AlertDialogDescription>Delete this {itemToDelete.type}?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
