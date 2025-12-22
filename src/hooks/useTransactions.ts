"use client";

import { useAppState } from './useAppState';
import type { Purchase, Sale, StockAdjustment, LocationTransfer, PurchaseReturn, SaleReturn, MasterItem } from '@/lib/types';

/**
 * Legacy hook - provides empty safe defaults
 * All data queries return empty arrays to prevent undefined errors
 */
export function useTransactions() {
  const appState = useAppState();

  return {
    purchases: appState.purchases ??  [],
    sales: appState.sales ?? [],
    adjustments: appState.adjustments ??  [],
    locationTransfers: appState.transfers ?? [],
    purchaseReturns: appState.purchaseReturns ?? [],
    saleReturns: appState. saleReturns ?? [],
    isLoaded: appState.isInitialized ??  false,
    
    masterData: appState.masterData ?? {
      Customer: [],
      Supplier: [],
      Agent: [],
      Transporter: [],
      Warehouse: [],
      Broker: [],
      Expense: [],
      Product: [],
    },
    
    addOrUpdateMaster: () => {},
    getAllMasters: appState.getAllMasters ?? (() => []),
    
    // Stubs for dispatch
    addPurchase: () => {},
    updatePurchase: () => {},
    deletePurchase: () => {},
    addSale: () => {},
    updateSale: () => {},
    deleteSale: () => {},
    addTransfer: () => {},
    addAdjustment: () => {},
    addReturn: () => {},
    setPurchases: () => {},
    setSales: () => {},
    setPurchaseReturns: () => {},
    setSaleReturns: () => {},
    setPayments: () => {},
    setReceipts: () => {},
    setLocationTransfers: () => {},
    setAdjustments: () => {},
    payments: [],
    receipts: [],
    ledger: [],
    isTransactionsLoaded: appState.isInitialized ?? false,
    isMasterDataLoaded: appState.isInitialized ?? false,
  };
}