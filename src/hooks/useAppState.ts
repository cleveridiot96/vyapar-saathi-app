import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Purchase, Sale, MasterItem, PurchaseReturn, SaleReturn, LocationTransfer, Payment, Receipt, StockAdjustment, LedgerEntry, MasterItemType, Customer, Supplier, Agent, Broker, Warehouse, Transporter, Expense } from '@/lib/types';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';
import { useMemo } from 'react';

interface AppState {
  // Data
  purchases: Purchase[];
  sales: Sale[];
  purchaseReturns: PurchaseReturn[];
  saleReturns: SaleReturn[];
  locationTransfers: LocationTransfer[];
  payments: Payment[];
  receipts: Receipt[];
  adjustments: StockAdjustment[];
  ledger: LedgerEntry[];
  masterData: {
    Customer: Customer[];
    Supplier: Supplier[];
    Agent: Agent[];
    Broker: Broker[];
    Warehouse: Warehouse[];
    Transporter: Transporter[];
    Expense: Expense[];
  };
  
  // Loading state
  isLoaded: boolean;
  
  // Actions
  setPurchases: (purchases: Purchase[] | ((prev: Purchase[]) => Purchase[])) => void;
  addPurchase: (purchase: Purchase) => void;
  updatePurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  
  setSales: (sales: Sale[] | ((prev: Sale[]) => Sale[])) => void;
  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  
  setPurchaseReturns: (returns: PurchaseReturn[] | ((prev: PurchaseReturn[]) => PurchaseReturn[])) => void;
  setSaleReturns: (returns: SaleReturn[] | ((prev: SaleReturn[]) => SaleReturn[])) => void;
  setLocationTransfers: (transfers: LocationTransfer[] | ((prev: LocationTransfer[]) => LocationTransfer[])) => void;
  setPayments: (payments: Payment[] | ((prev: Payment[]) => Payment[])) => void;
  setReceipts: (receipts: Receipt[] | ((prev: Receipt[]) => Receipt[])) => void;
  setAdjustments: (adjustments: StockAdjustment[] | ((prev: StockAdjustment[]) => StockAdjustment[])) => void;
  setLedger: (ledger: LedgerEntry[] | ((prev: LedgerEntry[]) => LedgerEntry[])) => void;

  addOrUpdateMaster: (item: MasterItem) => void;
  getAllMasters: () => MasterItem[];
  
  setLoaded: (loaded: boolean) => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      purchases: [],
      sales: [],
      purchaseReturns: [],
      saleReturns: [],
      locationTransfers: [],
      payments: [],
      receipts: [],
      adjustments: [],
      ledger: [],
      masterData: {
        Customer: [],
        Supplier: [],
        Agent: [],
        Broker: [],
        Warehouse: [...FIXED_WAREHOUSES],
        Transporter: [],
        Expense: [...FIXED_EXPENSES],
      },
      isLoaded: false,
      
      // Setters
      setPurchases: (updater) => set((state) => ({ purchases: typeof updater === 'function' ? updater(state.purchases) : updater })),
      setSales: (updater) => set((state) => ({ sales: typeof updater === 'function' ? updater(state.sales) : updater })),
      setPurchaseReturns: (updater) => set((state) => ({ purchaseReturns: typeof updater === 'function' ? updater(state.purchaseReturns) : updater })),
      setSaleReturns: (updater) => set((state) => ({ saleReturns: typeof updater === 'function' ? updater(state.saleReturns) : updater })),
      setLocationTransfers: (updater) => set((state) => ({ locationTransfers: typeof updater === 'function' ? updater(state.locationTransfers) : updater })),
      setPayments: (updater) => set((state) => ({ payments: typeof updater === 'function' ? updater(state.payments) : updater })),
      setReceipts: (updater) => set((state) => ({ receipts: typeof updater === 'function' ? updater(state.receipts) : updater })),
      setAdjustments: (updater) => set((state) => ({ adjustments: typeof updater === 'function' ? updater(state.adjustments) : updater })),
      setLedger: (updater) => set((state) => ({ ledger: typeof updater === 'function' ? updater(state.ledger) : updater })),

      // Purchase actions
      addPurchase: (purchase) => set((state) => ({ purchases: [purchase, ...state.purchases] })),
      updatePurchase: (purchase) => set((state) => ({ purchases: state.purchases.map((p) => p.id === purchase.id ? purchase : p) })),
      deletePurchase: (id) => set((state) => ({ purchases: state.purchases.filter((p) => p.id !== id) })),
      
      // Sale actions
      addSale: (sale) => set((state) => ({ sales: [sale, ...state.sales] })),
      updateSale: (sale) => set((state) => ({ sales: state.sales.map((s) => s.id === sale.id ? sale : s) })),
      deleteSale: (id) => set((state) => ({ sales: state.sales.filter((s) => s.id !== id) })),
      
      // Master data action
      addOrUpdateMaster: (item) => set((state) => {
        const type = item.type as Exclude<MasterItemType, 'Product'>;
        if (!state.masterData[type]) return state; // Should not happen with correct types

        const masterList = state.masterData[type];
        const existingIndex = masterList.findIndex((i) => i.id === item.id);
        
        let updatedList;
        if (existingIndex > -1) {
          updatedList = [...masterList];
          updatedList[existingIndex] = item;
        } else {
          updatedList = [...masterList, item];
        }

        return {
          masterData: {
            ...state.masterData,
            [type]: updatedList.sort((a,b) => a.name.localeCompare(b.name))
          }
        };
      }),
      
      getAllMasters: () => {
          const { masterData } = get();
          return [
              ...masterData.Customer, ...masterData.Supplier, ...masterData.Agent,
              ...masterData.Broker, ...masterData.Warehouse, ...masterData.Transporter,
              ...masterData.Expense
          ];
      },

      setLoaded: (loaded) => set({ isLoaded: loaded }),
    }),
    {
      name: 'vyapar-saathi-app-state-v2', // Changed name to force a state reset if old version exists
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoaded(true);
        }
      }
    }
  )
);
