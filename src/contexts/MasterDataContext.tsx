"use client";

import React, { createContext, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { MasterItem, MasterItemType, Customer, Supplier, Agent, Transporter, Warehouse, Broker, Expense } from '@/lib/types';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';

type MasterData = {
    Customer: Customer[];
    Supplier: Supplier[];
    Agent: Agent[];
    Transporter: Transporter[];
    Warehouse: Warehouse[];
    Broker: Broker[];
    Expense: Expense[];
}

interface MasterDataContextType {
  data: MasterData | null;
  addOrUpdateMaster: (item: MasterItem) => void;
  isMasterDataLoaded: boolean;
  getAllMasters: () => MasterItem[];
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers, cLoading] = useLocalStorageState<Customer[]>('masters_customers', []);
  const [suppliers, setSuppliers, supLoading] = useLocalStorageState<Supplier[]>('masters_suppliers', []);
  const [agents, setAgents, aLoading] = useLocalStorageState<Agent[]>('masters_agents', []);
  const [transporters, setTransporters, tLoading] = useLocalStorageState<Transporter[]>('masters_transporters', []);
  const [warehouses, setWarehouses, wLoading] = useLocalStorageState<Warehouse[]>('masters_warehouses', [...FIXED_WAREHOUSES] as Warehouse[]);
  const [brokers, setBrokers, bLoading] = useLocalStorageState<Broker[]>('masters_brokers', []);
  const [expenses, setExpenses, eLoading] = useLocalStorageState<Expense[]>('masters_expenses', [...FIXED_EXPENSES] as Expense[]);
  
  const isMasterDataLoaded = !cLoading && !supLoading && !aLoading && !tLoading && !wLoading && !bLoading && !eLoading;

  const masterData = useMemo(() => {
    if (!isMasterDataLoaded) return null;
    return {
        Customer: customers,
        Supplier: suppliers,
        Agent: agents,
        Transporter: transporters,
        Warehouse: warehouses,
        Broker: brokers,
        Expense: expenses,
    }
  }, [isMasterDataLoaded, customers, suppliers, agents, transporters, warehouses, brokers, expenses]);


  const addOrUpdateMaster = useCallback((item: MasterItem) => {
    const setterMap: Record<MasterItemType, React.Dispatch<React.SetStateAction<any[]>>> = {
      Customer: setCustomers,
      Supplier: setSuppliers,
      Agent: setAgents,
      Transporter: setTransporters,
      Warehouse: setWarehouses,
      Broker: setBrokers,
      Expense: setExpenses,
      Product: () => {}, 
    };
      
    const setter = setterMap[item.type];
    if (setter) {
        setter((prev) => {
            const existingIndex = prev.findIndex(i => i.id === item.id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = item;
                return updated.sort((a,b) => a.name.localeCompare(b.name));
            } else {
                return [...prev, item].sort((a,b) => a.name.localeCompare(b.name));
            }
        });
    }
  }, [setCustomers, setSuppliers, setAgents, setTransporters, setWarehouses, setBrokers, setExpenses]);
  
  const getAllMasters = useCallback(() => {
    return [
      ...customers,
      ...suppliers,
      ...agents,
      ...transporters,
      ...warehouses,
      ...brokers,
      ...expenses,
    ];
  }, [customers, suppliers, agents, transporters, warehouses, brokers, expenses]);

  const value = {
    data: masterData,
    addOrUpdateMaster,
    isMasterDataLoaded,
    getAllMasters
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
}
