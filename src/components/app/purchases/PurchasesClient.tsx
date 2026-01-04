
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
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTransactions, useMasters } from "@/hooks/useTransactions";
import type { Purchase, PurchaseReturn, MasterItem, LedgerEntry } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { renderToStaticMarkup } from 'react-dom/server';
import dynamic from 'next/dynamic';
import { useInventory } from "@/hooks/useInventory";
import { Loader2 } from "lucide-react";
import { isStudio } from "@/lib/isStudio";

const PurchaseTable = dynamic(() => import('./PurchaseTable').then(mod => mod.PurchaseTable), { 
  ssr: false,
  loading: () => <div className="p-6 text-muted-foreground">Loading table…</div> 
});
const AddPurchaseForm = dynamic(() => import('./AddPurchaseForm').then(mod => mod.AddPurchaseForm), { ssr: false });
const PurchaseChittiPrint = dynamic(() => import('./PurchaseChittiPrint').then(mod => mod.PurchaseChittiPrint), { ssr: false });
const AddPurchaseReturnForm = dynamic(() => import('./AddPurchaseReturnForm').then(mod => mod.AddPurchaseReturnForm), { ssr: false });
const PurchaseReturnTable = dynamic(() => import('./PurchaseReturnTable').then(mod => mod.PurchaseReturnTable), { 
  ssr: false,
  loading: () => <div className="p-6 text-muted-foreground">Loading table…</div> 
});


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


export function PurchasesClient() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  
  const { 
      purchases,
      purchaseReturns,
      isTransactionsLoaded,
      addPurchase, updatePurchase, deletePurchase,
      addPurchaseReturn, 
      addLedgerEntry, removeLedgerEntries
  } = useTransactions();
  const { masterData, addOrUpdateMaster, getAllMasters, isMastersLoaded } = useMasters();
  
  const { availableStock } = useInventory();

  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = React.useState<Purchase | null>(null);
  
  const [isAddReturnFormOpen, setIsAddReturnFormOpen] = React.useState(false);
  const [purchaseReturnToEdit, setPurchaseReturnToEdit] = React.useState<PurchaseReturn | null>(null);

  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'purchase' | 'return'} | null>(null);
  const [activeTab, setActiveTab] = React.useState('purchases');
  
  const filteredPurchases = React.useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return (purchases || []).filter(p => p && p.date && isDateInFinancialYear(p.date, financialYear));
  }, [purchases, financialYear, isTransactionsLoaded]);

  const filteredPurchaseReturns = React.useMemo(() => {
    if (!isTransactionsLoaded) return [];
    return (purchaseReturns || []).filter(pr => pr && pr.date && isDateInFinancialYear(pr.date, financialYear));
  }, [purchaseReturns, financialYear, isTransactionsLoaded]);

  const handleAddOrUpdatePurchase = React.useCallback(async (purchase: Purchase) => {
    const isEditing = (purchases || []).some(p => p.id === purchase.id);
    if (isEditing) {
      await updatePurchase(purchase);
    } else {
      await addPurchase(purchase);
    }
    
    await removeLedgerEntries(purchase.id);
    const newLedgerEntries: LedgerEntry[] = [];
    (purchase.expenses || []).forEach(exp => {
      newLedgerEntries.push({
        id: `exp-${purchase.id}-${exp.id}`,
        date: purchase.date,
        type: 'Expense',
        account: exp.account,
        debit: exp.amount,
        credit: 0,
        paymentMode: exp.paymentMode,
        party: exp.partyName || 'Self',
        partyId: exp.partyId,
        relatedVoucher: purchase.id,
        linkedTo: { voucherType: 'Purchase', voucherId: purchase.id },
        remarks: `Expense for purchase ${purchase.id}`
      });
    });
    if(newLedgerEntries.length > 0) await addLedgerEntry(newLedgerEntries);

    setPurchaseToEdit(null);
    setIsAddFormOpen(false);
    toast({ title: "Success!", description: isEditing ? "Purchase updated." : "Purchase added." });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [purchases, addPurchase, updatePurchase, toast, removeLedgerEntries, addLedgerEntry]);

  const handleEditPurchase = React.useCallback((purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setIsAddFormOpen(true);
  }, []);

  const handleDeleteAttempt = React.useCallback((id: string, type: 'purchase' | 'return') => {
    setItemToDelete({ id, type });
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!itemToDelete) return;
    if(itemToDelete.type === 'purchase') {
      await deletePurchase(itemToDelete.id);
      await removeLedgerEntries(itemToDelete.id);
      toast({ title: "Deleted!", description: "Purchase record removed.", variant: "destructive" });
    } else {
      // Logic for deleting returns would go here
      toast({ title: "Delete not implemented for returns", variant: "destructive" });
    }
    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [itemToDelete, deletePurchase, removeLedgerEntries, toast]);

  const handleAddOrUpdatePurchaseReturn = React.useCallback(async (returnData: PurchaseReturn) => {
     await addPurchaseReturn(returnData);
    setIsAddReturnFormOpen(false);
    toast({ title: "Success!", description: "Purchase return recorded." });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [addPurchaseReturn, toast]);

  const handleEditReturn = React.useCallback((pr: PurchaseReturn) => {
    setPurchaseReturnToEdit(pr);
    setIsAddReturnFormOpen(true);
  }, []);
  
  const triggerDownloadPdf = React.useCallback((purchase: Purchase) => {
    const chittiHtml = renderToStaticMarkup(<PurchaseChittiPrint purchase={purchase} />);
    openPrintWindow(chittiHtml, `PurchaseChitti_${purchase.id.slice(-4)}`);
  }, []);

  const addButtonDynamicClass = React.useMemo(() => {
    return activeTab === 'purchases' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white';
  }, [activeTab]);
  
  const ready = isStudio || (isTransactionsLoaded && isMastersLoaded && !isAppHydrating);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-20rem)] p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">Loading Purchases Data...</p>
        <p className="text-sm text-muted-foreground">This may take a moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 print-area min-h-screen w-full">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-2" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 no-print">
        <h1 className="text-2xl font-bold text-foreground uppercase">Purchases & Returns (FY ${financialYear})</h1>
      </div>

      <Tabs defaultValue="purchases" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="purchases" className="py-2.5 text-base rounded-md"><ListChecks className="mr-2 h-5 w-5" />Purchases</TabsTrigger>
          <TabsTrigger value="purchaseReturns" className="py-2.5 text-base rounded-md"><RotateCcw className="mr-2 h-5 w-5" />Purchase Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setPurchaseToEdit(null); setIsAddFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <PurchaseTable data={filteredPurchases ?? []} onEdit={handleEditPurchase} onDelete={(id) => handleDeleteAttempt(id, 'purchase')} onDownloadPdf={triggerDownloadPdf} />
        </TabsContent>

        <TabsContent value="purchaseReturns">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button onClick={() => { setPurchaseReturnToEdit(null); setIsAddReturnFormOpen(true); }} size="default" className={cn("text-base py-2 px-5 shadow-md", addButtonDynamicClass)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Return
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
          </div>
          <PurchaseReturnTable data={filteredPurchaseReturns ?? []} onEdit={handleEditReturn} onDelete={(id) => handleDeleteAttempt(id, 'return')} />
        </TabsContent>
      </Tabs>
      
      {isAddFormOpen && (
        <AddPurchaseForm
          key={purchaseToEdit ? purchaseToEdit.id : 'new-purchase'}
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSubmit={handleAddOrUpdatePurchase}
          purchaseToEdit={purchaseToEdit}
          masterData={masterData}
          addOrUpdateMaster={addOrUpdateMaster}
          getAllMasters={getAllMasters}
          availableStock={availableStock}
        />
      )}

      {isAddReturnFormOpen && (
        <AddPurchaseReturnForm
            key={purchaseReturnToEdit ? purchaseReturnToEdit.id : 'new-return'}
            isOpen={isAddReturnFormOpen}
            onClose={() => setIsAddReturnFormOpen(false)}
            onSubmit={handleAddOrUpdatePurchaseReturn}
            purchases={purchases || []}
            existingPurchaseReturns={purchaseReturns || []}
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
      
      {isStudio && <div className="fixed bottom-2 right-2 text-xs bg-black text-white p-1 rounded">STUDIO MODE</div>}

    </div>
  );
}
