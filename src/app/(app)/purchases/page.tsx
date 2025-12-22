"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer } from "lucide-react";
import type { Purchase, PurchaseReturn } from "@/lib/types";
import { PurchaseTable } from "@/components/app/purchases/PurchaseTable";
import { AddPurchaseForm } from "@/components/app/purchases/AddPurchaseForm";
import { AddPurchaseReturnForm } from "@/components/app/purchases/AddPurchaseReturnForm";
import { PurchaseReturnTable } from "@/components/app/purchases/PurchaseReturnTable";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAppState } from "@/hooks/useAppState";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCollapse, RotateCcw } from "lucide-react";

export default function PurchasesPage() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();

  // GET FROM UNIFIED ZUSTAND STORE
  const {
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    purchaseReturns,
    setPurchaseReturns,
    sales,
    locationTransfers,
    masterData,
    addOrUpdateMaster,
    getAllMasters,
    isLoaded,
  } = useAppState();


  const [isAddPurchaseFormOpen, setIsAddPurchaseFormOpen] = React.useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = React.useState<Purchase | null>(null);
  const [isAddPurchaseReturnFormOpen, setIsAddPurchaseReturnFormOpen] = React.useState(false);
  const [purchaseReturnToEdit, setPurchaseReturnToEdit] = React.useState<PurchaseReturn | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{
    id: string;
    type: "purchase" | "return";
  } | null>(null);
  const [activeTab, setActiveTab] = React.useState("purchases");

  const handleAddOrUpdatePurchase = React.useCallback(
    (purchase: Purchase) => {
      const isEditing = !!purchaseToEdit;
      
      if (isEditing) {
        updatePurchase(purchase);
        toast({ title: "Success!", description: "Purchase updated successfully." });
      } else {
        addPurchase(purchase);
        toast({ title: "Success!", description: "Purchase added successfully." });
      }
      
      setPurchaseToEdit(null);
      setIsAddPurchaseFormOpen(false);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("reindex-search"));
      }, 100);
    },
    [purchaseToEdit, addPurchase, updatePurchase, toast]
  );

  const handleDeletePurchaseAttempt = React.useCallback(
    (purchaseId: string) => {
      const purchaseToDelete = purchases.find((p) => p.id === purchaseId);
      if (!purchaseToDelete) return;

      const lotNumbersInPurchase = purchaseToDelete.items.map(
        (item) => item.lotNumber
      );

      const isUsedInSales = sales.some((sale) =>
        sale.items.some((item) => lotNumbersInPurchase.includes(item.lotNumber))
      );

      if (isUsedInSales) {
        toast({
          title: "Deletion Prohibited",
          description: "Cannot delete. Stock from this purchase has been used in a sale.",
          variant: "destructive",
        });
        return;
      }

      const isUsedInTransfers = locationTransfers.some((transfer) =>
        transfer.items.some((item) =>
          lotNumbersInPurchase.includes(item.originalLotNumber)
        )
      );

      if (isUsedInTransfers) {
        toast({
          title: "Deletion Prohibited",
          description: "Cannot delete. Stock from this purchase has been transferred.",
          variant: "destructive",
        });
        return;
      }

      setItemToDelete({ id: purchaseId, type: "purchase" });
    },
    [purchases, sales, locationTransfers, toast]
  );

  const confirmDelete = React.useCallback(() => {
    if (itemToDelete) {
      if (itemToDelete.type === "purchase") {
        deletePurchase(itemToDelete.id);
        toast({
          title: "Deleted!",
          description: "Purchase record removed.",
          variant: "destructive",
        });
      } else {
        setPurchaseReturns(
          (prev) => prev.filter((pr) => pr.id !== itemToDelete.id)
        );
        toast({
          title: "Deleted!",
          description: "Purchase return record removed.",
          variant: "destructive",
        });
      }
      setItemToDelete(null);
      window.dispatchEvent(new CustomEvent("reindex-search"));
    }
  }, [itemToDelete, deletePurchase, setPurchaseReturns, toast]);

    const handleAddOrUpdatePurchaseReturn = React.useCallback(
    (prData: PurchaseReturn) => {
      const isEditing = purchaseReturns.some((pr) => pr.id === prData.id);
      setPurchaseReturns(prev => {
        return isEditing
          ? prev.map((pr) => (pr.id === prData.id ? prData : pr))
          : [{ ...prData, id: prData.id || `pr-${Date.now()}` }, ...prev]
      });
      setPurchaseReturnToEdit(null);
      setIsAddPurchaseReturnFormOpen(false);
      toast({
        title: "Success!",
        description: isEditing ? "Purchase return updated." : "Purchase return added.",
      });
      window.dispatchEvent(new CustomEvent("reindex-search"));
    },
    [setPurchaseReturns, purchaseReturns, toast]
  );

  const handleEditPurchaseReturn = React.useCallback((pr: PurchaseReturn) => {
    setPurchaseReturnToEdit(pr);
    setIsAddPurchaseReturnFormOpen(true);
  }, []);

  const handleDeletePurchaseReturnAttempt = React.useCallback((prId: string) => {
    setItemToDelete({ id: prId, type: "return" });
  }, []);

  const filteredPurchases = React.useMemo(() => {
    if (isAppHydrating || !isLoaded) return [];
    return purchases.filter(
      (purchase) =>
        purchase &&
        purchase.date &&
        isDateInFinancialYear(purchase.date, financialYear)
    );
  }, [purchases, financialYear, isAppHydrating, isLoaded]);


  const filteredPurchaseReturns = React.useMemo(() => {
    if (isAppHydrating || !isLoaded) return [];
    return purchaseReturns.filter(
      (pr) => pr && pr.date && isDateInFinancialYear(pr.date, financialYear)
    );
  }, [purchaseReturns, financialYear, isAppHydrating, isLoaded]);

  const handleEditPurchase = (purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setIsAddPurchaseFormOpen(true);
  };

  const openAddPurchaseForm = React.useCallback(() => {
    setPurchaseToEdit(null);
    setIsAddPurchaseFormOpen(true);
  }, []);
  
    const openAddPurchaseReturnForm = React.useCallback(() => {
    setPurchaseReturnToEdit(null);
    setIsAddPurchaseReturnFormOpen(true);
  }, []);
  
  const addButtonDynamicClass = React.useMemo(() => {
    if (activeTab === "purchases") {
      return "bg-blue-600 hover:bg-blue-700 text-white";
    }
    if (activeTab === "purchaseReturns") {
      return "bg-orange-600 hover:bg-orange-700 text-white";
    }
    return "bg-primary hover:bg-primary/90"; // Fallback
  }, [activeTab]);

  React.useEffect(() => {
    console.log('===============================');
    console.log('PURCHASES ZUSTAND STATE:', purchases.length);
    console.log('Purchases:', purchases.map(p => ({ id: p.id, supplier: p.supplierName })));
    console.log('===============================');
  }, [purchases]);

  if (isAppHydrating || !isLoaded) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[calc(100vh-22rem)] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Purchases (FY {financialYear})</h1>
      
        <Tabs
        defaultValue="purchases"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 h-10 mb-2 no-print">
          <TabsTrigger value="purchases" className="py-2.5 text-base rounded-md">
            <ListCollapse className="mr-2 h-5 w-5" />
            Purchases
          </TabsTrigger>
          <TabsTrigger
            value="purchaseReturns"
            className="py-2.5 text-base rounded-md"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Purchase Returns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button
              onClick={openAddPurchaseForm}
              size="default"
              className={cn(
                "text-base py-2 px-5 shadow-md",
                addButtonDynamicClass
              )}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.print()}
            >
              <Printer className="h-5 w-5" />
              <span className="sr-only">Print</span>
            </Button>
          </div>
          <PurchaseTable
            data={filteredPurchases}
            onEdit={handleEditPurchase}
            onDelete={handleDeletePurchaseAttempt}
            onDownloadPdf={() => {}}
          />
        </TabsContent>

        <TabsContent value="purchaseReturns">
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button
              onClick={openAddPurchaseReturnForm}
              size="default"
              className={cn(
                "text-base py-2 px-5 shadow-md",
                addButtonDynamicClass
              )}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase Return
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.print()}
            >
              <Printer className="h-5 w-5" />
              <span className="sr-only">Print</span>
            </Button>
          </div>
          <PurchaseReturnTable
            data={filteredPurchaseReturns}
            onEdit={handleEditPurchaseReturn}
            onDelete={handleDeletePurchaseReturnAttempt}
          />
        </TabsContent>
      </Tabs>

      {isAddPurchaseFormOpen && (
        <AddPurchaseForm
          isOpen={isAddPurchaseFormOpen}
          onClose={() => setIsAddPurchaseFormOpen(false)}
          onSubmit={handleAddOrUpdatePurchase}
          purchaseToEdit={purchaseToEdit}
          masterData={masterData}
          addOrUpdateMaster={addOrUpdateMaster}
          getAllMasters={getAllMasters}
        />
      )}
      
       {isAddPurchaseReturnFormOpen && (
        <AddPurchaseReturnForm
          key={
            purchaseReturnToEdit
              ? purchaseReturnToEdit.id
              : "new-purchase-return"
          }
          isOpen={isAddPurchaseReturnFormOpen}
          onClose={() => setIsAddPurchaseReturnFormOpen(false)}
          onSubmit={handleAddOrUpdatePurchaseReturn}
          purchases={purchases}
          existingPurchaseReturns={purchaseReturns}
          purchaseReturnToEdit={purchaseReturnToEdit}
        />
      )}

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete This Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
