"use client";

import { useAppState, useAppDispatch } from './useAppState';
import type { Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, MasterItem } from '@/lib/types';

/**
 * Legacy hook - redirects to new useAppState
 * Kept for backward compatibility during migration
 */
export function useTransactions() {
  const appState = useAppState();
  const dispatch = useAppDispatch();

  return {
    purchases: appState.purchases,
    sales: appState.sales,
    adjustments: appState.adjustments,
    locationTransfers: appState.locationTransfers,
    purchaseReturns: appState.purchaseReturns,
    saleReturns: appState.saleReturns,
    payments: appState.payments,
    receipts: appState.receipts,
    ledger: appState.ledger,
    isTransactionsLoaded: appState.isInitialized,
    isMasterDataLoaded: appState.isInitialized,
    
    masterData: appState.masterData,
    
    addOrUpdateMaster: dispatch.addOrUpdateMaster,
    getAllMasters: appState.getAllMasters,
    
    setPayments: dispatch.setPayments,
    setReceipts: dispatch.setReceipts,
    setPurchases: dispatch.setPurchases,
    setSales: dispatch.setSales,
    setSaleReturns: dispatch.setSaleReturns,
    setPurchaseReturns: dispatch.setPurchaseReturns,
    setLocationTransfers: dispatch.setLocationTransfers,
    setAdjustments: dispatch.setAdjustments,
  };
}
