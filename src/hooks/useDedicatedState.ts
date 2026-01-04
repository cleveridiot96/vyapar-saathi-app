"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Sale, Purchase, MasterItem } from '@/lib/types';

export const useDedicatedState = () => {
  // SALES
  const sales = useLiveQuery(() => db.sales.toArray(), [], [] as Sale[]);
  const addSale = async (sale: Sale) => {
    const saleData = { ...sale, id: sale.id || `sale-${Date.now()}` };
    await db.sales.add(saleData);
  };
  const updateSale = async (sale: Sale) => {
    await db.sales.put(sale);
  };
  const deleteSale = async (id: string) => {
    await db.sales.delete(id);
  };

  // PURCHASES
  const purchases = useLiveQuery(() => db.purchases.toArray(), [], [] as Purchase[]);
  const addPurchase = async (purchase: Purchase) => {
    const purchaseData = { ...purchase, id: purchase.id || `purchase-${Date.now()}` };
    await db.purchases.add(purchaseData);
  };
  const updatePurchase = async (purchase: Purchase) => {
    await db.purchases.put(purchase);
  };
  const deletePurchase = async (id: string) => {
    await db.purchases.delete(id);
  };

  // MASTERS
  const masters = useLiveQuery(() => db.masters.toArray(), [], [] as MasterItem[]);
  
  const masterData = React.useMemo(() => {
    const grouped: { [key in MasterItemType]?: MasterItem[] } = {};
    (masters || []).forEach(m => {
        if (!grouped[m.type]) {
            grouped[m.type] = [];
        }
        grouped[m.type]!.push(m);
    });
    return grouped;
  }, [masters]);

  const addMaster = async (master: MasterItem) => {
    await db.masters.put({ ...master, id: master.id || `master-${Date.now()}` });
  };
  const getAllMasters = () => masters || [];


  return {
    sales: sales || [],
    setSales: (val: Sale[]) => db.sales.bulkPut(val), // Bulk update
    purchases: purchases || [],
    setPurchases: (val: Purchase[]) => db.purchases.bulkPut(val),
    addSale,
    updateSale,
    deleteSale,
    addPurchase,
    updatePurchase,
    deletePurchase,
    masterData,
    getAllMasters,
    addMaster,
    isTransactionsLoaded: sales !== undefined && purchases !== undefined && masters !== undefined, 
  };
};
