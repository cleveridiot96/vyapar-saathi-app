import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sale } from '@/lib/types';

interface SaleStore {
  sales: Sale[];
  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  setSales: (sales: Sale[]) => void;
}

export const useSaleStore = create<SaleStore>()(
  persist(
    (set) => ({
      sales: [],
      
      addSale: (sale) => {
        set((state) => {
          const newSales = [sale, ...state.sales];
          console.log('✅ Sale added to store:', sale.id, 'Total:', newSales.length);
          return { sales: newSales };
        });
      },
      
      updateSale: (sale) => {
        set((state) => ({
          sales: state.sales.map((s) => (s.id === sale.id ? sale : s))
        }));
      },
      
      deleteSale: (id) => {
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id)
        }));
      },
      
      setSales: (sales) => {
        set({ sales });
      },
    }),
    {
      name: 'sales-storage',
      version: 1,
    }
  )
);
