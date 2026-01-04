"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, ListChecks, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { isDateInFinancialYear } from "@/lib/utils";
import { useDedicatedState } from "@/hooks/useDedicatedState";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Sale, SaleReturn } from "@/lib/types";
import dynamic from 'next/dynamic';

const SaleTable = dynamic(() => import('./SaleTable').then(mod => mod.SaleTable), { ssr: false });
const AddSaleForm = dynamic(() => import('./AddSaleForm').then(mod => mod.AddSaleForm), { ssr: false });
const SaleReturnTable = dynamic(() => import('./SaleReturnTable').then(mod => mod.SaleReturnTable), { ssr: false });

export function SalesClient() {
  const { toast } = useToast();
  const { financialYear } = useSettings();
  
  // USE THE NEW, DEDICATED HOOK
  const { 
    sales, 
    addSale,
    updateSale,
    deleteSale,
    isTransactionsLoaded
  } = useDedicatedState();

  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [saleToEdit, setSaleToEdit] = React.useState<Sale | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'sale' | 'return'} | null>(null);
  const [activeTab, setActiveTab] = React.useState('sales');

  const filteredSales = React.useMemo(() => {
    if (!isTransactionsLoaded || !sales) return [];
    return sales.filter(s => s && s.date && isDateInFinancialYear(s.date, financialYear));
  }, [sales, financialYear, isTransactionsLoaded]);

  const handleAddOrUpdateSale = (sale: Sale) => {
    const isEditing = saleToEdit !== null;
    if (isEditing) {
        updateSale(sale);
        toast({ title: "Success", description: "Sale updated successfully." });
    } else {
        addSale(sale);
        toast({ title: "Success", description: "Sale added successfully." });
    }
    setIsAddFormOpen(false);
    setSaleToEdit(null);
  };

  const handleEditSale = (sale: Sale) => {
    setSaleToEdit(sale);
    setIsAddFormOpen(true);
  };

  const handleDeleteSale = (id: string) => {
    setItemToDelete({ id, type: 'sale' });
  };
  
  const confirmDelete = () => {
    if (itemToDelete && itemToDelete.type === 'sale') {
      deleteSale(itemToDelete.id);
      toast({ title: "Deleted!", description: "Sale record removed.", variant: "destructive" });
    }
    setItemToDelete(null);
  }

  const addButtonClass = activeTab === 'sales' 
    ? 'bg-green-600 hover:bg-green-700 text-white' 
    : 'bg-orange-600 hover:bg-orange-700 text-white';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales & Returns (FY {financialYear})</h1>
        <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="sales" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">
            <ListChecks className="mr-2 h-4 w-4" /> Sales
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="mr-2 h-4 w-4" /> Returns
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
           <div className="flex justify-end gap-2">
             <Button onClick={() => { setSaleToEdit(null); setIsAddFormOpen(true); }} className={cn(addButtonClass)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
             </Button>
           </div>
          
           <div className="text-sm text-muted-foreground mb-2">
              Showing {filteredSales.length} sale(s)
           </div>
          
          <SaleTable 
            data={filteredSales}
            onEdit={handleEditSale}
            onDelete={handleDeleteSale}
          />
        </TabsContent>
        
        <TabsContent value="returns">
           <div className="text-center py-8 text-gray-500">
             {/* <SaleReturnTable data={[]} onEdit={()=>{}} onDelete={()=>{}} /> */}
             Returns functionality coming soon...
            </div>
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
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this {itemToDelete.type}?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
