
"use client";

import { useReducer, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { TransactionEvent, MasterItem, Purchase, Sale, Payment, Receipt, LocationTransfer, StockAdjustment, PurchaseReturn, SaleReturn, LedgerEntry, MasterItemType } from '@/lib/types';
import { calculateInventory, type AggregatedInventoryItem } from '@/lib/inventoryEngine';
import { groupMasters } from '@/lib/utils';

// This file is now the single source of truth for application state.
// It replaces useLocalStorageState and the old event-based system.

interface AppState {
  masterData: { [key in MasterItemType]: MasterItem[] };
  purchases: Purchase[];
  sales: Sale[];
  payments: Payment[];
  receipts: Receipt[];
  locationTransfers: LocationTransfer[];
  adjustments: StockAdjustment[];
  purchaseReturns: PurchaseReturn[];
  saleReturns: SaleReturn[];
  ledger: LedgerEntry[];
  inventory: AggregatedInventoryItem[];
  isLoaded: boolean;
  getAllMasters: () => MasterItem[];
}

type Action = 
  | { type: 'SET_DATA'; payload: {
      masters: MasterItem[],
      purchases: Purchase[],
      sales: Sale[],
      payments: Payment[],
      receipts: Receipt[],
      locationTransfers: LocationTransfer[],
      adjustments: StockAdjustment[],
      purchaseReturns: PurchaseReturn[],
      saleReturns: SaleReturn[],
      ledger: LedgerEntry[],
  } }
  | TransactionEvent;


function reducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  switch (action.type) {
    case 'SET_DATA':
        newState = { 
            ...state,
            ...action.payload, 
            masterData: groupMasters(action.payload.masters),
            isLoaded: true,
        };
        break;

    // --- Dispatcher cases ---
    case 'MASTER_UPSERTED': {
        const masters = [...state.getAllMasters()];
        const index = masters.findIndex(m => m.id === action.payload.id);
        if (index > -1) {
            masters[index] = action.payload;
        } else {
            masters.push(action.payload);
        }
        newState = { ...state, masterData: groupMasters(masters) };
        break;
    }
    
    // Simple CRUD for transactions
    case 'PURCHASE_CREATED': newState = { ...state, purchases: [action.payload, ...state.purchases] }; break;
    case 'PURCHASE_UPDATED': newState = { ...state, purchases: state.purchases.map(p => p.id === action.payload.id ? action.payload : p) }; break;
    case 'PURCHASE_DELETED': newState = { ...state, purchases: state.purchases.filter(p => p.id !== action.payload.id) }; break;
    
    case 'SALE_CREATED': newState = { ...state, sales: [action.payload, ...state.sales] }; break;
    case 'SALE_UPDATED': newState = { ...state, sales: state.sales.map(s => s.id === action.payload.id ? action.payload : s) }; break;
    case 'SALE_DELETED': newState = { ...state, sales: state.sales.filter(s => s.id !== action.payload.id) }; break;
    
    case 'PAYMENT_CREATED': newState = { ...state, payments: [action.payload, ...state.payments] }; break;
    case 'PAYMENT_UPDATED': newState = { ...state, payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p) }; break;
    case 'PAYMENT_DELETED': newState = { ...state, payments: state.payments.filter(p => p.id !== action.payload.id) }; break;
    
    case 'RECEIPT_CREATED': newState = { ...state, receipts: [action.payload, ...state.receipts] }; break;
    case 'RECEIPT_UPDATED': newState = { ...state, receipts: state.receipts.map(r => r.id === action.payload.id ? action.payload : r) }; break;
    case 'RECEIPT_DELETED': newState = { ...state, receipts: state.receipts.filter(r => r.id !== action.payload.id) }; break;

    case 'TRANSFER_CREATED': newState = { ...state, locationTransfers: [action.payload, ...state.locationTransfers] }; break;
    case 'ADJUSTMENT_CREATED': newState = { ...state, adjustments: [action.payload, ...state.adjustments] }; break;
    
    case 'RETURN_CREATED': {
      if (action.payload.type === 'PurchaseReturn') {
        newState = { ...state, purchaseReturns: [action.payload, ...state.purchaseReturns] };
      } else {
        newState = { ...state, saleReturns: [action.payload, ...state.saleReturns] };
      }
      break;
    }
    
    case 'LEDGER_ENTRY_CREATED': newState = { ...state, ledger: [...state.ledger, ...(action.payload)] }; break;
    case 'LEDGER_ENTRY_DELETED': newState = { ...state, ledger: state.ledger.filter(l => l.relatedVoucher !== action.payload.voucherId) }; break;

    default:
      return state;
  }

  // Recalculate derived state (inventory) after any change
  newState.inventory = calculateInventory(
    newState.purchases, newState.sales, newState.adjustments, 
    newState.locationTransfers, newState.purchaseReturns, newState.saleReturns
  );
  
  return newState;
}

const createInitialState = (): AppState => ({
  masterData: groupMasters([]),
  purchases: [],
  sales: [],
  payments: [],
  receipts: [],
  locationTransfers: [],
  adjustments: [],
  purchaseReturns: [],
  saleReturns: [],
  ledger: [],
  inventory: [],
  isLoaded: false,
  getAllMasters: () => [],
});

export const useAppState = () => {
    const [state, dispatch] = useReducer(reducer, createInitialState());

    const isLoaded = useLiveQuery(async () => {
        const [masters, purchases, sales, payments, receipts, locationTransfers, adjustments, purchaseReturns, saleReturns, ledger] = await Promise.all([
            db.masters.toArray(),
            db.purchases.toArray(),
            db.sales.toArray(),
            db.payments.toArray(),
            db.receipts.toArray(),
            db.locationTransfers.toArray(),
            db.adjustments.toArray(),
            db.purchaseReturns.toArray(),
            db.saleReturns.toArray(),
            db.ledger.toArray(),
        ]);
        
        dispatch({ type: 'SET_DATA', payload: { masters, purchases, sales, payments, receipts, locationTransfers, adjustments, purchaseReturns, saleReturns, ledger }});
        return true;
    }, [], false);

    const getAllMasters = useMemo(() => () => Object.values(state.masterData).flat(), [state.masterData]);
    
    const finalState = useMemo(() => ({
        ...state,
        getAllMasters,
        isLoaded: state.isLoaded && isLoaded,
    }), [state, getAllMasters, isLoaded]);

    return { state: finalState, dispatch };
};


export const useAppDispatch = () => {
    // This is now a simplified version that dispatches directly.
    // In a larger app, this might wrap dispatches with logging, etc.
    const { dispatch } = useAppState();
    
    const addOrUpdateMaster = (item: MasterItem) => dispatch({ type: 'MASTER_UPSERTED', payload: item });
    
    const addPurchase = (item: Purchase) => dispatch({ type: 'PURCHASE_CREATED', payload: item });
    const updatePurchase = (item: Purchase) => dispatch({ type: 'PURCHASE_UPDATED', payload: item });
    const deletePurchase = (id: string) => dispatch({ type: 'PURCHASE_DELETED', payload: { id } });
    
    const addSale = (item: Sale) => dispatch({ type: 'SALE_CREATED', payload: item });
    const updateSale = (item: Sale) => dispatch({ type: 'SALE_UPDATED', payload: item });
    const deleteSale = (id: string) => dispatch({ type: 'SALE_DELETED', payload: { id } });

    const addPayment = (item: Payment) => dispatch({ type: 'PAYMENT_CREATED', payload: item });
    const updatePayment = (item: Payment) => dispatch({ type: 'PAYMENT_UPDATED', payload: item });
    const deletePayment = (id: string) => dispatch({ type: 'PAYMENT_DELETED', payload: { id } });

    const addReceipt = (item: Receipt) => dispatch({ type: 'RECEIPT_CREATED', payload: item });
    const updateReceipt = (item: Receipt) => dispatch({ type: 'RECEIPT_UPDATED', payload: item });
    const deleteReceipt = (id: string) => dispatch({ type: 'RECEIPT_DELETED', payload: { id } });

    const addLocationTransfer = (item: LocationTransfer) => dispatch({ type: 'TRANSFER_CREATED', payload: item });
    const addAdjustment = (item: StockAdjustment) => dispatch({ type: 'ADJUSTMENT_CREATED', payload: item });
    const addReturn = (item: PurchaseReturn | SaleReturn) => dispatch({ type: 'RETURN_CREATED', payload: item });

    const addLedgerEntry = (items: LedgerEntry[]) => dispatch({ type: 'LEDGER_ENTRY_CREATED', payload: items });
    const removeLedgerEntries = (voucherId: string) => dispatch({ type: 'LEDGER_ENTRY_DELETED', payload: { voucherId } });
    
    const hasUnsavedChanges = false; // Legacy, no longer used
    const setHasUnsavedChanges = () => {};
    const loadEvents = () => {}; // Legacy

    return {
        addOrUpdateMaster,
        addPurchase, updatePurchase, deletePurchase,
        addSale, updateSale, deleteSale,
        addPayment, updatePayment, deletePayment,
        addReceipt, updateReceipt, deleteReceipt,
        addLocationTransfer, addAdjustment, addReturn,
        addLedgerEntry, removeLedgerEntries,
        hasUnsavedChanges, setHasUnsavedChanges, loadEvents
    };
};

// Kept for any legacy components that might still use it temporarily
export const AppContext = React.createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { state, dispatch } = useAppState();
    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

    