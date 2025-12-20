import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Purchase } from '@/lib/types';

interface PurchaseStore {
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => void;
  updatePurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  initializePurchases: (purchases: Purchase[]) => void;
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set) => ({
      purchases: [],
      
      addPurchase: (purchase) => {
        set((state) => ({
          purchases: [purchase, ...state.purchases]
        }));
        console.log('✅ Purchase added:', purchase.id);
      },
      
      updatePurchase: (purchase) => {
        set((state) => ({
          purchases: state.purchases.map((p) => 
            p.id === purchase.id ? purchase : p
          )
        }));
        console.log('✅ Purchase updated:', purchase.id);
      },
      
      deletePurchase: (id) => {
        set((state) => ({
          purchases: state.purchases.filter((p) => p.id !== id)
        }));
        console.log('✅ Purchase deleted:', id);
      },
      
      initializePurchases: (purchases) => {
        set({ purchases });
        console.log('✅ Purchases initialized:', purchases.length);
      },
    }),
    {
      name: 'purchases-storage',
      version: 1,
    }
  )
);
