"use client";

import * as React from "react";
import ReactDOM from "react-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, ListCollapse, RotateCcw } from "lucide-react";
import type { Purchase, PurchaseReturn, LedgerEntry } from "@/lib/types";
import { PurchaseTable } from "@/components/app/purchases/PurchaseTable";
import { AddPurchaseForm } from "@/components/app/purchases/AddPurchaseForm";
import { PurchaseChittiPrint } from "@/components/app/purchases/PurchaseChittiPrint";
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
import { PrintHeaderSymbol } from "@/components/shared/PrintHeaderSymbol";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";

function openPrintWindow(
  reactNode: React.ReactElement,
  title: string = "Document"
) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("Please allow pop-ups to print this document.");
    return;
  }

  const printDocument = printWindow.document;
  printDocument.write(`
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
            .print-chitti-styles { font-family: Arial, sans-serif; line-height: 1.4; }
            .print-chitti-styles h1, .print-chitti-styles h2 { margin: 0; padding: 0; }
            .print-chitti-styles hr { border-top: 1px solid #888; margin: 4px 0; }
            .print-chitti-styles table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            .print-chitti-styles th, .print-chitti-styles td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
            .print-chitti-styles th { background-color: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-chitti-styles .flex-between { display: flex; justify-content: space-between; align-items: baseline; }
            .print-chitti-styles .font-bold { font-weight: bold; }
            .print-chitti-styles .text-right { text-align: right; }
            .print-chitti-styles .mb-1 { margin-bottom: 0.25rem; }
            .print-chitti-styles .mb-2 { margin-bottom: 0.5rem; }
            .print-chitti-styles .mt-1 { margin-top: 0.25rem; }
            .print-chitti-styles .mt-2 { margin-top: 0.5rem; }
            .print-chitti-styles .mt-4 { margin-top: 1rem; }
            .print-chitti-styles .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .print-chitti-styles .underline-val { border-bottom: 1px solid black; padding-bottom: 1px; }
          }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
        <script>
          setTimeout(function() {
            window.print();
            window.close();
          }, 250);
        </script>
      </body>
    </html>
  `);
  printDocument.close();

  const printRoot = printDocument.getElementById("print-root");
  if (printRoot) {
    ReactDOM.render(reactNode, printRoot);
  }
}

export default function PurchasesPage() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  const {
    purchases,
    setPurchases,
    purchaseReturns,
    setPurchaseReturns,
    sales,
    locationTransfers,
    addLedgerEntry,
    removeLedgerEntries,
    isTransactionsLoaded,
  } = useTransactions();

  const [isAddPurchaseFormOpen, setIsAddPurchaseFormOpen] =
    React.useState(false);
  const [purchaseToEdit, setPurchaseToEdit] =
    React.useState<Purchase | null>(null);

  const [isAddPurchaseReturnFormOpen, setIsAddPurchaseReturnFormOpen] =
    React.useState(false);
  const [purchaseReturnToEdit, setPurchaseReturnToEdit] =
    React.useState<PurchaseReturn | null>(null);

  const [itemToDelete, setItemToDelete] = React.useState<{
    id: string;
    type: "purchase" | "return";
  } | null>(null);

  const [activeTab, setActiveTab] = React.useState("purchases");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
                return;
            }
            if(activeTab === 'purchases') {
              openAddPurchaseForm();
            } else {
              openAddPurchaseReturnForm();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);


  const filteredPurchases = React.useMemo(() => {
    if (isAppHydrating || !isTransactionsLoaded) return [];
    return purchases.filter(
      (purchase) =>
        purchase &&
        purchase.date &&
        isDateInFinancialYear(purchase.date, financialYear)
    );
  }, [purchases, financialYear, isAppHydrating, isTransactionsLoaded]);

  const filteredPurchaseReturns = React.useMemo(() => {
    if (isAppHydrating || !isTransactionsLoaded) return [];
    return purchaseReturns.filter(
      (pr) => pr && pr.date && isDateInFinancialYear(pr.date, financialYear)
    );
  }, [purchaseReturns, financialYear, isAppHydrating, isTransactionsLoaded]);

  const handleAddOrUpdatePurchase = React.useCallback(
    (purchase: Purchase) => {
      const isEditing = purchases.some((p) => p.id === purchase.id);
      setPurchases((prevPurchases) => {
        return isEditing
          ? prevPurchases.map((p) => (p.id === purchase.id ? purchase : p))
          : [
              { ...purchase, id: purchase.id || `purchase-${Date.now()}` },
              ...prevPurchases,
            ];
      });

      removeLedgerEntries(purchase.id);
      if (purchase.expenses && purchase.expenses.length > 0) {
        const newLedgerEntries = purchase.expenses
          .filter((exp) => exp.amount > 0)
          .map((exp) => ({
            id: `ledger-${purchase.id}-${(exp.account || "exp").replace(
              /\\s/g,
              ""
            )}`,
            date: purchase.date,
            type: "Expense" as const,
            account: exp.account,
            debit: exp.amount,
            credit: 0,
            paymentMode: exp.paymentMode,
            party: exp.partyName || "Self",
            partyId: exp.partyId,
            relatedVoucher: purchase.id,
            linkedTo: {
              voucherType: "Purchase" as const,
              voucherId: purchase.id,
            },
            remarks: `Expense for purchase from ${purchase.supplierName}`,
          } as LedgerEntry));

        if (newLedgerEntries.length > 0) {
          addLedgerEntry(newLedgerEntries);
        }
      }

      setPurchaseToEdit(null);
      setIsAddPurchaseFormOpen(false);
      toast({
        title: "Success!",
        description: isEditing ? "Purchase updated." : "Purchase added.",
      });
      window.dispatchEvent(new CustomEvent("reindex-search"));
    },
    [setPurchases, purchases, addLedgerEntry, removeLedgerEntries, toast]
  );

  const handleEditPurchase = (purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setIsAddPurchaseFormOpen(true);
  };

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
          description:
            "Cannot delete. Stock from this purchase has been used in a sale.",
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
          description:
            "Cannot delete. Stock from this purchase has been transferred.",
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
        setPurchases((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        removeLedgerEntries(itemToDelete.id);
        toast({
          title: "Deleted!",
          description: "Purchase record removed.",
          variant: "destructive",
        });
      } else {
        setPurchaseReturns((prev) =>
          prev.filter((pr) => pr.id !== itemToDelete.id)
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
  }, [itemToDelete, setPurchases, setPurchaseReturns, removeLedgerEntries, toast]);

  const handleAddOrUpdatePurchaseReturn = React.useCallback(
    (prData: PurchaseReturn) => {
      const isEditing = purchaseReturns.some((pr) => pr.id === prData.id);
      setPurchaseReturns((prevReturns) => {
        return isEditing
          ? prevReturns.map((pr) => (pr.id === prData.id ? prData : pr))
          : [{ ...prData, id: prData.id || `pr-${Date.now()}` }, ...prevReturns];
      });
      setPurchaseReturnToEdit(null);
      setIsAddPurchaseReturnFormOpen(false);
      toast({
        title: "Success!",
        description: purchaseReturns.some((pr) => pr.id === prData.id)
          ? "Purchase return updated."
          : "Purchase return added.",
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

  const openAddPurchaseForm = React.useCallback(() => {
    setPurchaseToEdit(null);
    setIsAddPurchaseFormOpen(true);
  }, []);
  const openAddPurchaseReturnForm = React.useCallback(() => {
    setPurchaseReturnToEdit(null);
    setIsAddPurchaseReturnFormOpen(true);
  }, []);

  const triggerPrintPurchaseChitti = React.useCallback((purchase: Purchase) => {
    openPrintWindow(
      <PurchaseChittiPrint purchase={purchase} />,
      `PurchaseChitti_${purchase.items[0]?.lotNumber || "Purchase"}`
    );
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

  if (isAppHydrating || !isTransactionsLoaded)
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground">Loading data...</p>
      </div>
    );

  return (
    <div className="space-y-2 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-2" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 no-print">
        <h1 className="text-2xl font-bold text-foreground uppercase">
          Purchases & Returns (FY {financialYear})
        </h1>
      </div>

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
            onDownloadPdf={triggerPrintPurchaseChitti}
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
          key={purchaseToEdit ? purchaseToEdit.id : "new-purchase"}
          isOpen={isAddPurchaseFormOpen}
          onClose={() => setIsAddPurchaseFormOpen(false)}
          onSubmit={handleAddOrUpdatePurchase}
          purchaseToEdit={purchaseToEdit}
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
          purchases={filteredPurchases}
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
              This will permanently delete this record. This action cannot be
              undone.
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
