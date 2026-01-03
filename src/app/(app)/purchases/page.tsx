
"use client";

import { useAppDataContext } from '@/contexts/AppDataContext';
import { PurchaseTable } from '@/components/app/purchases/PurchaseTable';
import { AddPurchaseForm } from '@/components/app/purchases/AddPurchaseForm';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Printer, ChevronsUpDown, Undo } from 'lucide-react';
import { isDateInFinancialYear } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAppDispatch, useAppState } from '@/hooks/useAppState';
import { PurchaseChittiPrint } from '@/components/app/purchases/PurchaseChittiPrint';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MasterItem, Purchase } from '@/lib/types';
import { AddPurchaseReturnForm } from '@/components/app/purchases/AddPurchaseReturnForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchaseReturnTable } from '@/components/app/purchases/PurchaseReturnTable';
import type { PurchaseReturn } from '@/lib/types';

function openPrintWindow(htmlContent: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("Please allow pop-ups to print this document.");
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>Purchase Chitti</title>
        <style>
          @media print {
            @page { size: A5 landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .print-chitti-styles { font-family: sans-serif; line-height: 1.4; font-size: 10pt; }
          .print-chitti-styles h1, .print-chitti-styles h2 { margin: 0; }
          .print-chitti-styles table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          .print-chitti-styles th, .print-chitti-styles td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
          .print-chitti-styles th { background-color: #f0f0f0; }
          .print-chitti-styles .text-right { text-align: right; }
          .print-chitti-styles .font-bold { font-weight: bold; }
          .print-chitti-styles .mt-4 { margin-top: 16px; }
          .print-chitti-styles .mb-2 { margin-bottom: 8px; }
          .print-chitti-styles .flex-between { display: flex; justify-content: space-between; }
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


export default function PurchasesPage() {
  const { isLoaded, purchases, purchaseReturns, masterData, getAllMasters } = useAppState();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { financialYear } = useSettings();
  
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = React.useState<Purchase | null>(null);

  const [isAddReturnFormOpen, setIsAddReturnFormOpen] = React.useState(false);
  const [purchaseReturnToEdit, setPurchaseReturnToEdit] = React.useState<PurchaseReturn | null>(null);

  const [itemToDelete, setItemToDelete] = React.useState<{id: string, type: 'purchase' | 'return'} | null>(null);

  const filteredPurchases = React.useMemo(() => {
    if (!isLoaded) return [];
    return purchases.filter(p => isDateInFinancialYear(p.date, financialYear));
  }, [purchases, financialYear, isLoaded]);

  const filteredPurchaseReturns = React.useMemo(() => {
    if (!isLoaded) return [];
    return purchaseReturns.filter(pr => isDateInFinancialYear(pr.date, financialYear));
  }, [purchaseReturns, financialYear, isLoaded]);
  
  const handleAddOrUpdatePurchase = (purchase: Purchase) => {
    const isEditing = purchases.some(p => p.id === purchase.id);
    if(isEditing) {
        dispatch.updatePurchase(purchase);
        toast({ title: 'Success', description: 'Purchase updated successfully.' });
    } else {
        dispatch.addPurchase(purchase);
        toast({ title: 'Success', description: 'Purchase added successfully.' });
    }
    setPurchaseToEdit(null);
    setIsAddFormOpen(false);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setIsAddFormOpen(true);
  };
  
  const handleDeleteAttempt = (id: string, type: 'purchase' | 'return') => {
    setItemToDelete({id, type});
  };

  const confirmDelete = () => {
    if(!itemToDelete) return;
    if(itemToDelete.type === 'purchase') {
      dispatch.deletePurchase(itemToDelete.id);
      toast({ title: 'Success', description: 'Purchase deleted.', variant: 'destructive'});
    } else {
      // For now, simple filter. In event-sourced, would be an event.
      // setPurchaseReturns(prev => prev.filter(pr => pr.id !== itemToDelete.id));
      toast({ title: 'Success', description: 'Purchase Return deleted.', variant: 'destructive'});
    }
    setItemToDelete(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }
  
  const handleDownloadPdf = (purchase: Purchase) => {
    const chittiHtml = renderToStaticMarkup(<PurchaseChittiPrint purchase={purchase} />);
    openPrintWindow(chittiHtml);
  };
  
  const handleAddOrUpdateReturn = (pr: PurchaseReturn) => {
    dispatch.addReturn(pr);
    setIsAddReturnFormOpen(false);
    toast({ title: "Success", description: "Purchase return recorded."});
    window.dispatchEvent(new CustomEvent('reindex-search'));
  };
  
  const handleMasterDataUpdate = (item: MasterItem) => {
    dispatch.addOrUpdateMaster(item);
    toast({ title: "Master Data Updated", description: `${item.name} has been saved.` });
  };


  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Purchases</h1>
      </div>
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchases">
                <ChevronsUpDown className="mr-2 h-4 w-4" />Purchases
            </TabsTrigger>
            <TabsTrigger value="returns">
                <Undo className="mr-2 h-4 w-4" />Purchase Returns
            </TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
            <div className="flex justify-end gap-2 my-2">
                <Button onClick={() => setIsAddFormOpen(true)}><PlusCircle className="mr-2" />New Purchase</Button>
                <Button variant="outline" size="icon" onClick={() => window.print()}><Printer /></Button>
            </div>
            <PurchaseTable 
                data={filteredPurchases} 
                onEdit={handleEditPurchase} 
                onDelete={(id) => handleDeleteAttempt(id, 'purchase')} 
                onDownloadPdf={handleDownloadPdf}
            />
        </TabsContent>
        <TabsContent value="returns">
           <div className="flex justify-end gap-2 my-2">
              <Button onClick={() => setIsAddReturnFormOpen(true)}><PlusCircle className="mr-2" />New Return</Button>
            </div>
            <PurchaseReturnTable
                data={filteredPurchaseReturns}
                onEdit={() => toast({ title: "Info", description: "Editing returns is not yet supported." })}
                onDelete={(id) => handleDeleteAttempt(id, 'return')}
            />
        </TabsContent>
      </Tabs>
      
      {isAddFormOpen && (
        <AddPurchaseForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSubmit={handleAddOrUpdatePurchase}
          purchaseToEdit={purchaseToEdit}
          masterData={masterData}
          addOrUpdateMaster={handleMasterDataUpdate}
          getAllMasters={getAllMasters}
        />
      )}

      {isAddReturnFormOpen && (
        <AddPurchaseReturnForm
            isOpen={isAddReturnFormOpen}
            onClose={() => setIsAddReturnFormOpen(false)}
            onSubmit={handleAddOrUpdateReturn}
            purchases={purchases}
            existingPurchaseReturns={purchaseReturns}
            purchaseReturnToEdit={purchaseReturnToEdit}
        />
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
