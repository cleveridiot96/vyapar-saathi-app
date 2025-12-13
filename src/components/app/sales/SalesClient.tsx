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
import type { Sale, SaleReturn, MasterItem } from "@/lib/types";
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
  
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'n') {
            const activeElement = document.activeElement;
            if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
                return;
            }
            if(activeTab === 'sales') {
              setSaleToEdit(null);
              setIsAddSaleFormOpen(true);
            } else {
              setSaleReturnToEdit(null);
              setIsAddSaleReturnFormOpen(true);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

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
    setSales(prev => isEditing ? prev.map(s => s.id === sale.id ? sale : s) : [{...sale, id: sale.id || `sale-${Date.now()}`}, ...prev]);
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
        const saleHasReturn = saleReturns.some(sr => sr.originalSaleId === itemToDelete.id);
        if (saleHasReturn) {
            toast({ title: "Deletion Prohibited", description: "Cannot delete sale with existing returns.", variant: "destructive"});
            setItemToDelete(null);
            return;
        }
      setSales(prev => prev.filter(s => s.id !== itemToDelete.id));
      toast({ title: "Deleted!", description: "Sale record removed.", variant: "destructive" });
    } else {
      setSaleReturns(prev => prev.filter(sr => sr.id !== itemToDelete.id));
      toast({ title: "Deleted!", description: "Sale return record removed.", variant: "destructive" });
    }

    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, setSales, setSaleReturns, toast, saleReturns]);
  
  const handleAddOrUpdateSaleReturn = React.useCallback((srData: SaleReturn) => {
    const isEditing = saleReturns.some(sr => sr.id === srData.id);
    setSaleReturns(prev => isEditing ? prev.map(sr => sr.id === srData.id ? srData : sr) : [{...srData, id: srData.id || `sr-${Date.now()}`}, ...prev]);
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

  const handleMasterDataUpdate = React.useCallback((newItem: MasterItem) => {
    addOrUpdateMaster(newItem);
    toast({ title: `Master list updated for ${newItem.type}.` });
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
        <h1 className="text-2xl font-bold text-foreground uppercase">Sales & Returns (FY {financialYear})</h1>
      </div>

      <Tabs defaultValue="sales" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="sales" className="py-2.5 text-base rounded-md"><ListChecks className="mr-2 h-5 w-5" />Sales</TabsTrigger>
          <TabsTrigger value="saleReturns" className="py-2.5 text-base rounded-md"><RotateCcw className="mr-2 h-5 w-5" />Sale Returns</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setSaleToEdit(null); setIsAddSaleFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <SaleTable data={filteredSales} onEdit={handleEditSale} onDelete={(id) => handleDeleteAttempt(id, 'sale')} onDownloadPdf={triggerDownloadSalePdf} />
        </TabsContent>
        <TabsContent value="saleReturns">
           <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setSaleReturnToEdit(null); setIsAddSaleReturnFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
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
