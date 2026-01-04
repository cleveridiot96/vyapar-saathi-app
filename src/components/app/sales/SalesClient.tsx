"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, ListChecks, RotateCcw } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTransactions, useMasters } from "@/hooks/useTransactions";
import type { Sale, SaleReturn } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/hooks/useInventory";
import dynamic from 'next/dynamic';
import { renderToStaticMarkup } from "react-dom/server";

const SaleTable = dynamic(() => import('./SaleTable').then(mod => mod.SaleTable), { ssr: false });
const AddSaleForm = dynamic(() => import('./AddSaleForm').then(mod => mod.AddSaleForm), { ssr: false });
const SaleReturnTable = dynamic(() => import('./SaleReturnTable').then(mod => mod.SaleReturnTable), { ssr: false });
const SaleChittiPrint = dynamic(() => import('./SaleChittiPrint').then(mod => mod.SaleChittiPrint), { ssr: false });

function openPrintWindow(htmlContent: string, title = "Document") {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      alert("Please allow pop-ups to print this document.");
      return;
    }
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>
        @media print {
          @page { size: A5 portrait; margin: 10mm; }
          body { background: white !important; color: black !important; font-size: 10pt !important; }
          .print-chitti-styles { font-family: sans-serif; line-height: 1.4; }
          .print-chitti-styles h1, .print-chitti-styles h2 { margin-top: 0.5em; margin-bottom: 0.25em; }
          .print-chitti-styles table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          .print-chitti-styles th, .print-chitti-styles td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
          .print-chitti-styles th { background-color: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
          .print-chitti-styles .text-right { text-align: right; }
          .print-chitti-styles .font-bold { font-weight: bold; }
          .flex-between { display: flex; justify-content: space-between; }
          .mb-1 { margin-bottom: 4px; } .mb-2 { margin-bottom: 8px; }
          .mt-2 { margin-top: 8px; } .mt-4 { margin-top: 16px; }
          .text-lg { font-size: 1.125rem; } .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
        }
      </style>
      </head><body>${htmlContent}
      <script>setTimeout(function() { window.print(); window.close(); }, 250);</script>
      </body></html>`);
    printWindow.document.close();
}


export function SalesClient() {
  const { toast } = useToast();
  const { financialYear } = useSettings();
  
  const { 
      sales, addSale, updateSale, deleteSale,
      saleReturns, isTransactionsLoaded
  } = useTransactions();
  const { addOrUpdateMaster } = useMasters();
  
  const { availableStock } = useInventory();

  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [saleToEdit, setSaleToEdit] = React.useState<Sale | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'sale' | 'return'} | null>(null);
  const [activeTab, setActiveTab] = React.useState('sales');
  
  const filteredSales = React.useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return (sales || []).filter(s => s && s.date && isDateInFinancialYear(s.date, financialYear));
  }, [sales, financialYear, isTransactionsLoaded]);

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

  const confirmDelete = React.useCallback(() => {
    if (!itemToDelete) return;
    
    if(itemToDelete.type === 'sale') {
      deleteSale(itemToDelete.id);
      toast({ title: "Sale deleted!", variant: "destructive" });
    }
    
    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, deleteSale, toast]);
  
  const triggerDownloadPdf = React.useCallback((sale: Sale) => {
    const chittiHtml = renderToStaticMarkup(<SaleChittiPrint sale={sale} />);
    openPrintWindow(chittiHtml, `SaleChitti_${sale.id.slice(-4)}`);
  }, []);

  const addButtonClass = activeTab === 'sales' 
    ? 'bg-green-600 hover:bg-green-700 text-white' 
    : 'bg-orange-600 hover:bg-orange-700 text-white';

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold uppercase">Sales & Returns (FY ${financialYear})</h1>
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
            onDownloadPdf={triggerDownloadPdf}
          />
        </TabsContent>
        
        <TabsContent value="returns">
          <SaleReturnTable 
            data={saleReturns.filter(sr => isDateInFinancialYear(sr.date, financialYear))} 
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
    </div>
  );
}

    