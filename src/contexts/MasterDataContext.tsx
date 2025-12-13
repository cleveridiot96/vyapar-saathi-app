
"use client";

import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import type { MasterItem, MasterItemType, Customer, Supplier, Agent, Transporter, Warehouse, Broker, Expense } from '@/lib/types';
import { useTransactions } from '@/hooks/useTransactions';

// Define the context type to be more flexible
interface MasterDataContextType {
    data: Record<MasterItemType, MasterItem[]>;
    setData: (type: MasterItemType, data: MasterItem[] | ((prev: MasterItem[]) => MasterItem[])) => void;
    getAllMasters: () => MasterItem[];
    addOrUpdateMaster: (item: MasterItem) => void;
    isMasterDataLoaded: boolean;
    // Add direct access to each master data type
    Customer: Customer[];
    Supplier: Supplier[];
    Agent: Agent[];
    Transporter: Transporter[];
    Warehouse: Warehouse[];
    Broker: Broker[];
    Expense: Expense[];
}

// Create the context with a default undefined value
const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function useMasterData() {
    const context = useContext(MasterDataContext);
    if (!context) {
        throw new Error('useMasterData must be used within a MasterDataProvider');
    }
    return context;
}

// Create the provider component
export function MasterDataProvider({ children }: { children: ReactNode }) {
    const {
        customers, setCustomers,
        suppliers, setSuppliers,
        agents, setAgents,
        transporters, setTransporters,
        warehouses, setWarehouses,
        brokers, setBrokers,
        expenses, setExpenses,
        isMasterDataLoaded,
        getAllMasters,
    } = useTransactions();

    const data = useMemo(() => ({
        Customer: customers || [],
        Supplier: suppliers || [],
        Agent: agents || [],
        Transporter: transporters || [],
        Warehouse: warehouses || [],
        Broker: brokers || [],
        Expense: expenses || [],
        Product: [], 
    }), [customers, suppliers, agents, transporters, warehouses, brokers, expenses]);

    const setData = useCallback((type: MasterItemType, updatedData: MasterItem[] | ((prev: MasterItem[]) => MasterItem[])) => {
        const setterMap: Record<MasterItemType, React.Dispatch<React.SetStateAction<any[]>> | undefined> = {
            Customer: setCustomers,
            Supplier: setSuppliers,
            Agent: setAgents,
            Transporter: setTransporters,
            Warehouse: setWarehouses,
            Broker: setBrokers,
            Expense: setExpenses,
            Product: undefined,
        };

        const setter = setterMap[type];
        if (setter) {
            setter(updatedData as any);
        }
    }, [setCustomers, setSuppliers, setAgents, setTransporters, setWarehouses, setBrokers, setExpenses]);

    const addOrUpdateMaster = useCallback((item: MasterItem) => {
        setData(item.type, (prev) => {
            const existingIndex = prev.findIndex(i => i.id === item.id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = item;
                return updated.sort((a,b) => a.name.localeCompare(b.name));
            } else {
                return [...prev, item].sort((a,b) => a.name.localeCompare(b.name));
            }
        });
    }, [setData]);

    const contextValue = useMemo(() => ({
        data,
        setData,
        getAllMasters,
        addOrUpdateMaster,
        isMasterDataLoaded,
        // Provide direct access
        Customer: customers,
        Supplier: suppliers,
        Agent: agents,
        Transporter: transporters,
        Warehouse: warehouses,
        Broker: brokers,
        Expense: expenses,
    }), [data, setData, getAllMasters, addOrUpdateMaster, isMasterDataLoaded, customers, suppliers, agents, transporters, warehouses, brokers, expenses]);

    return (
        <MasterDataContext.Provider value={contextValue}>
            {children}
        </MasterDataContext.Provider>
    );
}
