"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, RotateCcw, ListChecks } from "lucide-react";
import type { Sale, SaleReturn } from "@/lib/types";
import { SaleTable } from "./SaleTable";
import { AddSaleForm } from "./AddSaleForm";
import { SaleReturnTable } from "./SaleReturnTable";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useInventory } from "@/hooks/useInventory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isDateInFinancialYear } from "@/lib/utils";

export function SalesClient() {
  const { toast } = useToast();
  const { financialYear } = useSettings();
  
  const { 
    sales, 
    setSales,
    saleReturns,
    setSaleReturns,
    addOrUpdateMaster,
    masterData,
    isTransactionsLoaded
  } = useTransactions();
  
  const { availableStock } = useInventory();

  const [isAddSaleFormOpen, setIsAddSaleFormOpen] = React.useState(false);
  const [saleToEdit, setSaleToEdit] = React.useState<Sale | null>(null);
  const [isAddSaleReturnFormOpen, setIsAddSaleReturnFormOpen] = React.useState(false);
  const [saleReturnToEdit, setSaleReturnToEdit] = React.useState<SaleReturn | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{ id: string, type: 'sale' | 'return' } | null>(null);
  const [activeTab, setActiveTab] = React.useState('sales');
  
  const filteredSales = React.useMemo(() => {
    console.log('=== SALES DEBUG ===');
    console.log('All sales:', sales);
    console.log('Count:', sales.length);
    console.log('Financial year:', financialYear);
    console.log('isLoaded:', isTransactionsLoaded);
    
    if (!isTransactionsLoaded) return [];
    return sales.filter(s => s && s.date && isDateInFinancialYear(s.date, financialYear));
  }, [sales, financialYear, isTransactionsLoaded]);

  const filteredSaleReturns = React.useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return saleReturns.filter(sr => sr && sr.date && isDateInFinancialYear(sr.date, financialYear));
  }, [saleReturns, financialYear, isTransactionsLoaded]);

  const handleAddOrUpdateSale = React.useCallback((sale: Sale) => {
    const isEditing = sales.some(s => s.id === sale.id);
    
    if (isEditing) {
      setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
      toast({ title: "Sale updated!" });
    } else {
      setSales(prev => [sale, ...prev]);
      toast({ title: "Sale added!" });
    }
    
    setSaleToEdit(null);
    setIsAddSaleFormOpen(false);
    window.dispatchEvent(new CustomEvent("reindex-search"));
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
      toast({ title: "Sale deleted!", variant: "destructive" });
    } else {
      setSaleReturns(prev => prev.filter(sr => sr.id !== itemToDelete.id));
      toast({ title: "Return deleted!", variant: "destructive" });
    }

    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, setSales, setSaleReturns, toast]);

  const addButtonClass = activeTab === 'sales' 
    ? 'bg-green-600 hover:bg-green-700 text-white' 
    : 'bg-red-600 hover:bg-red-700 text-white';

  if (!isTransactionsLoaded) {
    return <div className="p-8 text-center">Loading sales...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales (FY {financialYear})</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales"><ListChecks className="mr-2 h-4 w-4" />Sales</TabsTrigger>
          <TabsTrigger value="returns"><RotateCcw className="mr-2 h-4 w-4" />Returns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => { setSaleToEdit(null); setIsAddSaleFormOpen(true); }} 
              className={cn(addButtonClass)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">
            Showing {filteredSales.length} sale(s)
          </div>
          
          <SaleTable 
            data={filteredSales} 
            onEdit={handleEditSale} 
            onDelete={(id) => handleDeleteAttempt(id, 'sale')} 
          />
        </TabsContent>
        
        <TabsContent value="returns" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setSaleReturnToEdit(null); setIsAddSaleReturnFormOpen(true); }} 
              className={cn(addButtonClass)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Return
            </Button>
          </div>
          
          <SaleReturnTable 
            data={filteredSaleReturns} 
            onEdit={(sr) => { setSaleReturnToEdit(sr); setIsAddSaleReturnFormOpen(true); }}
            onDelete={(id) => handleDeleteAttempt(id, 'return')} 
          />
        </TabsContent>
      </Tabs>

      {isAddSaleFormOpen && (
        <AddSaleForm
          isOpen={isAddSaleFormOpen}
          onClose={() => setIsAddSaleFormOpen(false)}
          onSubmit={handleAddOrUpdateSale}
          availableStock={availableStock}
          existingSales={sales}
          saleToEdit={saleToEdit}
          onMasterDataUpdate={addOrUpdateMaster}
        />
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this {itemToDelete.type}?</p>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
