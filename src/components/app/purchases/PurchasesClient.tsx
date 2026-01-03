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
import { useAppDataContext } from "@/contexts/AppDataContext";
import type { Purchase, PurchaseReturn, MasterItem, Sale } from "@/lib/types";
import { renderToStaticMarkup } from 'react-dom/server';
import dynamic from 'next/dynamic';
import { useInventory } from '@/hooks/useInventory';

// Dynamic Imports
const PurchaseTable = dynamic(() => import('@/components/app/purchases/PurchaseTable').then(mod => mod.PurchaseTable), { ssr: false });
const AddPurchaseForm = dynamic(() => import('@/components/app/purchases/AddPurchaseForm').then(mod => mod.AddPurchaseForm), { ssr: false });
const PurchaseChittiPrint = dynamic(() => import('@/components/app/purchases/PurchaseChittiPrint').then(mod => mod.PurchaseChittiPrint), { ssr: false });
const AddPurchaseReturnForm = dynamic(() => import('@/components/app/purchases/AddPurchaseReturnForm').then(mod => mod.AddPurchaseReturnForm), { ssr: false });
const PurchaseReturnTable = dynamic(() => import('@/components/app/purchases/PurchaseReturnTable').then(mod => mod.PurchaseReturnTable), { ssr: false });


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
            @page { size: A5 portrait; margin: 10mm; }
            body { background: white !important; color: black !important; font-size: 10pt !important; }
             .print-chitti-styles { font-family: sans-serif; line-height: 1.4; }
            .print-chitti-styles h1, .print-chitti-styles h2 { margin-top: 0.5em; margin-bottom: 0.25em; }
            .print-chitti-styles table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            .print-chitti-styles th, .print-chitti-styles td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
            .print-chitti-styles th { background-color: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
            .print-chitti-styles .text-right { text-align: right; }
            .print-chitti-styles .font-bold { font-weight: bold; }
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


export function PurchasesClient() {
  const { toast } = useToast();
  const { financialYear } = useSettings();
  
  const { state, dispatch } = useAppDataContext();
  
  const { 
    purchases, 
    purchaseReturns, 
    isLoaded, 
    sales,
    masterData,
    getAllMasters,
    inventory, // FIX: Passing this as availableStock
  } = state;
  const { availableStock } = useInventory();

  const [isAddPurchaseFormOpen, setIsAddPurchaseFormOpen] = React.useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = React.useState<Purchase | null>(null);

  const [isAddPurchaseReturnFormOpen, setIsAddPurchaseReturnFormOpen] = React.useState(false);
  const [purchaseReturnToEdit, setPurchaseReturnToEdit] = React.useState<PurchaseReturn | null>(null);

  const [itemToDelete, setItemToDelete] = React.useState<{ id: string, type: 'purchase' | 'return' } | null>(null);
  
  const [activeTab, setActiveTab] = React.useState('purchases');
  
  const filteredPurchases = React.useMemo(() => {
    if (!isLoaded) return [];
    return purchases.filter(p => p && p.date && isDateInFinancialYear(p.date, financialYear));
  }, [purchases, financialYear, isLoaded]);

  const filteredPurchaseReturns = React.useMemo(() => {
    if (!isLoaded) return [];
    return purchaseReturns.filter(pr => pr && pr.date && isDateInFinancialYear(pr.date, financialYear));
  }, [purchaseReturns, financialYear, isLoaded]);

  const handleAddOrUpdatePurchase = React.useCallback(
    (purchase: Purchase) => {
      const isEditing = !!purchaseToEdit;
      
      if (isEditing) {
        dispatch.updatePurchase(purchase);
      } else {
        dispatch.addPurchase(purchase);
      }
      
      setPurchaseToEdit(null);
      setIsAddPurchaseFormOpen(false);
      
      toast({
        title: "Success!",
        description: isEditing ? "Purchase updated." : "Purchase added.",
      });
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("reindex-search"));
      }, 100);
    },
    [purchaseToEdit, dispatch, toast]
  );

  const handleEditPurchase = React.useCallback((purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setIsAddPurchaseFormOpen(true);
  }, []);

  const handleDeleteAttempt = React.useCallback((id: string, type: 'purchase' | 'return') => {
    setItemToDelete({ id, type });
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'purchase') {
      const saleHasReturn = sales.some(s => s.items.some((i: any) => i.lotNumber && i.lotNumber.startsWith(itemToDelete.id)));
      if (saleHasReturn) {
          toast({ title: "Deletion Prohibited", description: "Cannot delete a purchase with linked sales.", variant: "destructive"});
          setItemToDelete(null);
          return;
      }
      dispatch.deletePurchase(itemToDelete.id);
      toast({ title: "Deleted!", description: "Purchase record removed.", variant: "destructive" });
    } else {
      dispatch.setPurchaseReturns(purchaseReturns.filter(pr => pr.id !== itemToDelete.id));
      toast({ title: "Deleted!", description: "Purchase return record removed.", variant: "destructive" });
    }

    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, dispatch, toast, sales, purchaseReturns]);
  
  const handleAddOrUpdatePurchaseReturn = React.useCallback((prData: PurchaseReturn) => {
    dispatch.addReturn(prData);
    setPurchaseReturnToEdit(null);
    setIsAddPurchaseReturnFormOpen(false);
    toast({ title: "Success!", description: "Purchase return saved." });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [dispatch, toast]);

  const handleEditPurchaseReturn = React.useCallback((pr: PurchaseReturn) => {
    setPurchaseReturnToEdit(pr);
    setIsAddPurchaseReturnFormOpen(true);
  }, []);

  const triggerDownloadPurchasePdf = React.useCallback((purchase: Purchase) => {
    const chittiHtml = renderToStaticMarkup(<PurchaseChittiPrint purchase={purchase} />);
    openPrintWindow(chittiHtml, `PurchaseChitti_${purchase.id.slice(-4)}`);
  }, []);

  const handleMasterDataUpdate = React.useCallback((newItem: MasterItem) => {
    dispatch.addOrUpdateMaster(newItem);
    toast({ title: `Master list updated for ${newItem.type}.` });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [dispatch, toast]);
  
  const addButtonDynamicClass = React.useMemo(() => {
    return activeTab === 'purchases' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white';
  }, [activeTab]);

  return (
    <div className="space-y-2 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-2" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 no-print">
        <h1 className="text-2xl font-bold text-foreground uppercase">Purchases & Returns (FY {financialYear})</h1>
      </div>

      <Tabs defaultValue="purchases" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="purchases" className="py-2.5 text-base rounded-md"><ListChecks className="mr-2 h-5 w-5" />Purchases</TabsTrigger>
          <TabsTrigger value="purchaseReturns" className="py-2.5 text-base rounded-md"><RotateCcw className="mr-2 h-5 w-5" />Purchase Returns</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setPurchaseToEdit(null); setIsAddPurchaseFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <PurchaseTable data={filteredPurchases} onEdit={handleEditPurchase} onDelete={(id) => handleDeleteAttempt(id, 'purchase')} onDownloadPdf={triggerDownloadPurchasePdf} />
        </TabsContent>
        <TabsContent value="purchaseReturns">
           <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setPurchaseReturnToEdit(null); setIsAddPurchaseReturnFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase Return
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <PurchaseReturnTable data={filteredPurchaseReturns} onEdit={handleEditPurchaseReturn} onDelete={(id) => handleDeleteAttempt(id, 'return')} />
        </TabsContent>
      </Tabs>

      {isAddPurchaseFormOpen && (
        <AddPurchaseForm
          key={purchaseToEdit ? purchaseToEdit.id : 'new-purchase'}
          isOpen={isAddPurchaseFormOpen}
          onClose={() => setIsAddPurchaseFormOpen(false)}
          onSubmit={handleAddOrUpdatePurchase}
          purchaseToEdit={purchaseToEdit}
          masterData={masterData}
          addOrUpdateMaster={handleMasterDataUpdate}
          getAllMasters={getAllMasters}
          availableStock={availableStock}
        />
      )}
      
      {isAddPurchaseReturnFormOpen && (
        <AddPurchaseReturnForm
            key={purchaseReturnToEdit ? purchaseReturnToEdit.id : 'new-purchase-return'}
            isOpen={isAddPurchaseReturnFormOpen}
            onClose={() => setIsAddPurchaseReturnFormOpen(false)}
            onSubmit={handleAddOrUpdatePurchaseReturn}
            purchases={purchases}
            existingPurchaseReturns={purchaseReturns}
            purchaseReturnToEdit={purchaseReturnToEdit}
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
