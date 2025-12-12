"use client";

import { useState, useCallback } from 'react';
import type { MasterItem, MasterItemType } from '@/lib/types';

// Mock initial data
const initialMasterData: Record<MasterItemType, MasterItem[]> = {
    Supplier: [
        { id: 'sup1', type: 'Supplier', name: 'Krishna Traders' },
        { id: 'sup2', type: 'Supplier', name: 'Radha Trading Co' },
    ],
    Customer: [
        { id: 'cus1', type: 'Customer', name: 'Gopal Dairy' },
    ],
    Agent: [
        { id: 'agent1', type: 'Agent', name: 'Shyam Sundar', details: { commission: 2 } },
    ],
    Warehouse: [
        { id: 'wh1', type: 'Warehouse', name: 'Main Godown' },
    ],
    Transporter: [
        { id: 'trans1', type: 'Transporter', name: 'Ganesh Roadways' },
    ],
    Expense: [
        { id: 'exp1', type: 'Expense', name: 'Freight' },
        { id: 'exp2', type: 'Expense', name: 'Labour' },
        { id: 'exp3', type: 'Expense', name: 'Commission' },
    ],
    Product: [
        { id: 'prod1', type: 'Product', name: 'Arecanut' },
    ]
};


export function useMasterData() {
  const [masterData, setMasterData] = useState(initialMasterData);

  const addOrUpdateMaster = useCallback((item: MasterItem) => {
    setMasterData(prevData => {
      const existingItems = prevData[item.type] || [];
      const itemIndex = existingItems.findIndex(i => i.id === item.id);
      
      let updatedItems;
      if (itemIndex > -1) {
        // Update existing item
        updatedItems = [
          ...existingItems.slice(0, itemIndex),
          item,
          ...existingItems.slice(itemIndex + 1),
        ];
      } else {
        // Add new item
        const newItem = { ...item, id: item.id || `${item.type.toLowerCase()}-${Date.now()}` };
        updatedItems = [newItem, ...existingItems];
      }

      return { ...prevData, [item.type]: updatedItems };
    });
  }, []);
  
  const deleteMaster = useCallback((type: MasterItemType, id: string) => {
    setMasterData(prevData => ({
      ...prevData,
      [type]: (prevData[type] || []).filter(item => item.id !== id),
    }));
  }, []);

  const getAllMasters = useCallback(() => {
    return Object.values(masterData).flat();
  }, [masterData]);

  return { data: masterData, addOrUpdateMaster, deleteMaster, getAllMasters };
}
