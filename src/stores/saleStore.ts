import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sale } from '@/lib/types';

interface SaleStore {
  sales: Sale[];
  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  initializeSales: (sales: Sale[]) => void;
}

export const useSaleStore = create<SaleStore>()(
  persist(
    (set) => ({
      sales: [],
      
      addSale: (sale) => {
        set((state) => ({
          sales: [sale, ...state.sales]
        }));
        console.log('✅ Sale added:', sale.id);
      },
      
      updateSale: (sale) => {
        set((state) => ({
          sales: state.sales.map((s) => 
            s.id === sale.id ? sale : s
          )
        }));
        console.log('✅ Sale updated:', sale.id);
      },
      
      deleteSale: (id) => {
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id)
        }));
        console.log('✅ Sale deleted:', id);
      },
      
      initializeSales: (sales) => {
        set({ sales });
        console.log('✅ Sales initialized:', sales.length);
      },
    }),
    {
      name: 'sales-storage',
      version: 1,
    }
  )
);
