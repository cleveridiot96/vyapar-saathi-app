"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer } from "lucide-react";
import type { Payment, MasterItem, Sale } from "@/lib/types";
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
import { useOutstandingBalances } from '@/hooks/useOutstandingBalances';
import { useAppState, useAppDispatch } from "@/hooks/useAppState";
import dynamic from 'next/dynamic';

const PaymentTable = dynamic(() => import('./PaymentTable').then(mod => mod.PaymentTable), { ssr: false });
const AddPaymentForm = dynamic(() => import('./AddPaymentForm').then(mod => mod.AddPaymentForm), { ssr: false });


export function PaymentsClient() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  const { payments, purchases, sales, isLoaded, masterData } = useAppState();
  const dispatch = useAppDispatch();
  
  const { payableParties } = useOutstandingBalances();

  const [isAddPaymentFormOpen, setIsAddPaymentFormOpen] = React.useState(false);
  const [paymentToEdit, setPaymentToEdit] = React.useState<Payment | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [paymentToDeleteId, setPaymentToDeleteId] = React.useState<string | null>(null);

  const filteredPayments = React.useMemo(() => {
    if (isAppHydrating || !isLoaded) return [];
    return payments.filter(payment => payment && payment.date && isDateInFinancialYear(payment.date, financialYear));
  }, [payments, financialYear, isAppHydrating, isLoaded]);

  const handleAddOrUpdatePayment = React.useCallback((payment: Payment) => {
    const isEditing = payments.some(p => p.id === payment.id);
    
    if (payment.paymentType === 'Stock' && payment.stockItems && payment.stockItems.length > 0) {
      const stockValue = payment.stockItems.reduce((sum, item) => sum + item.value, 0);
      payment.amount = stockValue;

      const internalSale: Sale = {
        id: `sale-for-payment-${payment.id}`,
        date: payment.date,
        billNumber: `PAYMENT-KIND-${payment.partyName}`,
        customerId: payment.partyId,
        customerName: payment.partyName,
        items: payment.stockItems.map(si => ({
          id: `sitem-${si.lotNumber}-${payment.id}`,
          lotNumber: si.lotNumber, quantity: si.quantity, netWeight: si.netWeight, rate: si.rate,
          goodsValue: si.value, purchaseRate: 0, costOfGoodsSold: 0, itemGrossProfit: 0, itemNetProfit: 0,
        })),
        totalGoodsValue: stockValue, billedAmount: stockValue, totalQuantity: payment.stockItems.reduce((sum, item) => sum + item.quantity, 0),
        totalNetWeight: payment.stockItems.reduce((sum, item) => sum + item.netWeight, 0),
        totalCostOfGoodsSold: 0, totalGrossProfit: 0, totalCalculatedProfit: 0, notes: `Stock payment to settle balance. Ref Payment ID: ${payment.id}`,
        isStockPaymentSale: true,
      };
      
      const existingSaleIndex = sales.findIndex(s => s.id === internalSale.id);
      if(existingSaleIndex > -1) {
        dispatch.updateSale(internalSale);
      } else {
        dispatch.addSale(internalSale);
      }
    }

    if(isEditing) {
        dispatch.updatePayment(payment);
    } else {
        dispatch.addPayment(payment);
    }

    setPaymentToEdit(null);
    setIsAddPaymentFormOpen(false);
    toast({ title: "Success!", description: isEditing ? "Payment updated successfully." : "Payment added successfully." });
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [payments, sales, dispatch, toast]);

  const handleEditPayment = React.useCallback((payment: Payment) => {
    setPaymentToEdit(payment);
    setIsAddPaymentFormOpen(true);
  }, []);

  const handleDeletePaymentAttempt = React.useCallback((paymentId: string) => {
    setPaymentToDeleteId(paymentId);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeletePayment = React.useCallback(() => {
    if (paymentToDeleteId) {
      const paymentToDelete = payments.find(p => p.id === paymentToDeleteId);
      if (paymentToDelete?.paymentType === 'Stock') {
        const internalSaleId = `sale-for-payment-${paymentToDelete.id}`;
        dispatch.deleteSale(internalSaleId);
      }

      dispatch.deletePayment(paymentToDeleteId);
      toast({ title: "Success!", description: "Payment deleted successfully.", variant: "destructive" });
      setPaymentToDeleteId(null);
      setShowDeleteConfirm(false);
      window.dispatchEvent(new CustomEvent('reindex-search'));
    }
  }, [paymentToDeleteId, payments, dispatch, toast]);
  
  const handleMasterDataUpdate = (item: MasterItem) => {
    dispatch.addOrUpdateMaster(item);
    toast({ title: `Master list updated for ${item.type}.`});
  };

  const openAddPaymentForm = React.useCallback(() => {
    setPaymentToEdit(null);
    setIsAddPaymentFormOpen(true);
  }, []);

  const closeAddPaymentForm = React.useCallback(() => {
    setIsAddPaymentFormOpen(false);
    setPaymentToEdit(null);
  }, []);

  if (isAppHydrating || !isLoaded) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <p className="text-lg text-muted-foreground">Loading payments data...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 print-area">
      <PrintHeaderSymbol className="hidden print:block text-center text-lg font-semibold mb-4" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <h1 className="text-3xl font-bold text-foreground">Payments (FY {financialYear})</h1>
        <div className="flex gap-2">
            <Button onClick={openAddPaymentForm} size="lg" className="text-base py-3 px-6 shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Payment
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Printer className="h-5 w-5" />
                <span className="sr-only">Print</span>
            </Button>
        </div>
      </div>

      <PaymentTable data={filteredPayments} onEdit={handleEditPayment} onDelete={handleDeletePaymentAttempt} />

      {isAddPaymentFormOpen && (
        <AddPaymentForm
          key={paymentToEdit ? paymentToEdit.id : 'new-payment'}
          isOpen={isAddPaymentFormOpen}
          onClose={closeAddPaymentForm}
          onSubmit={handleAddOrUpdatePayment}
          parties={payableParties}
          onMasterDataUpdate={handleMasterDataUpdate}
          paymentToEdit={paymentToEdit}
          allPurchases={purchases}
          allPayments={payments}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record. If this was a stock payment, the related stock deduction will also be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePayment} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
