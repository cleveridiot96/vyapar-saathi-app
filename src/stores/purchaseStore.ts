import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Purchase } from '@/lib/types';

interface PurchaseStore {
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => void;
  updatePurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  setPurchases: (purchases: Purchase[]) => void;
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set) => ({
      purchases: [],
      
      addPurchase: (purchase) => {
        set((state) => {
          const newPurchases = [purchase, ...state.purchases];
          console.log('✅ Purchase added to store:', purchase.id, 'Total:', newPurchases.length);
          return { purchases: newPurchases };
        });
      },
      
      updatePurchase: (purchase) => {
        set((state) => {
          const updated = state.purchases.map((p) => 
            p.id === purchase.id ? purchase : p
          );
          console.log('✅ Purchase updated in store:', purchase.id);
          return { purchases: updated };
        });
      },
      
      deletePurchase: (id) => {
        set((state) => ({
          purchases: state.purchases.filter((p) => p.id !== id)
        }));
      },
      
      setPurchases: (purchases) => {
        set({ purchases });
      },
    }),
    {
      name: 'purchases-storage',
      version: 1,
    }
  )
);
