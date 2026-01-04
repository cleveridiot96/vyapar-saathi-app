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
import { Loader2 } from "lucide-react";
import { isStudio } from "@/lib/isStudio";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { DatabaseDiagnostic } from "@/components/DatabaseDiagnostic";
import { TestDataSeeder } from "@/components/TestDataSeeder";
import { useAppReady } from "@/lib/useAppReady";

const SaleTable = dynamic(() => import('./SaleTable').then(mod => mod.SaleTable), { 
  ssr: false,
  loading: () => <div className="p-6 text-muted-foreground">Loading table…</div>
});
const AddSaleForm = dynamic(() => import('./AddSaleForm').then(mod => mod.AddSaleForm), { ssr: false });
const SaleReturnTable = dynamic(() => import('./SaleReturnTable').then(mod => mod.SaleReturnTable), { 
  ssr: false,
  loading: () => <div className="p-6 text-muted-foreground">Loading table…</div>
});

export function SalesClient() {
  const { toast } = useToast();
  const { financialYear } = useSettings();
  const isAppReady = useAppReady();
  
  const sales = useLiveQuery(() => db.sales.toArray(), []) ?? [];
  const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), []) ?? [];
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) ?? [];
  
  const { addSale, updateSale, deleteSale } = useTransactions();
  
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [saleToEdit, setSaleToEdit] = React.useState<Sale | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'sale' | 'return'} | null>(null);
  const [activeTab, setActiveTab] = React.useState('sales');

  const salesWithBalances = React.useMemo(() => {
    if (!sales || !receipts) return [];
    
    const billPaidAmounts = new Map<string, number>();
    receipts.forEach(tx => {
        (tx.againstBills || []).forEach(ab => {
            billPaidAmounts.set(ab.billId, (billPaidAmounts.get(ab.billId) || 0) + ab.amount);
        });
    });

    return sales.map(sale => {
      const paid = billPaidAmounts.get(sale.id) || 0;
      const balanceAmount = sale.billedAmount - paid;
      return { ...sale, balanceAmount };
    });
  }, [sales, receipts]);

  const filteredSales = React.useMemo(() => {
    return (salesWithBalances || []).filter(s => s && s.date && isDateInFinancialYear(s.date, financialYear));
  }, [salesWithBalances, financialYear]);

  const filteredSaleReturns = React.useMemo(() => {
    return (saleReturns || []).filter(sr => sr && sr.date && isDateInFinancialYear(sr.date, financialYear));
  }, [saleReturns, financialYear]);


  const handleAddOrUpdateSale = React.useCallback(async (sale: Sale) => {
    const isEditing = sales.some(s => s.id === sale.id);
    
    if (isEditing) {
      await updateSale(sale);
      toast({ title: "Sale updated!" });
    } else {
      await addSale(sale);
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

  if (!isAppReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-20rem)] p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">Loading Sales Data...</p>
        <p className="text-sm text-muted-foreground">This may take a moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 min-h-screen w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold uppercase">Sales & Returns (FY {financialYear})</h1>
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
          existingSales={sales}
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

      {isStudio && (
          <div className="fixed bottom-4 right-4 grid grid-cols-1 gap-4">
              <DatabaseDiagnostic />
              <TestDataSeeder />
          </div>
      )}
    </div>
  );
}
