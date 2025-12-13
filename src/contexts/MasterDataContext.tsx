"use client";

import React, { createContext, useState, useEffect, useMemo, ReactNode, useCallback, useContext } from 'react';
import type { MasterItem, MasterItemType } from '@/lib/types';
import { FIXED_WAREHOUSES, FIXED_EXPENSES, MASTER_TYPES_CONFIG } from '@/lib/constants';

// Define the shape of the master data
type MasterData = Record<MasterItemType, MasterItem[]>;

// Define the context type
export interface MasterDataContextType {
    data: MasterData;
    setData: (type: MasterItemType, data: MasterItem[] | ((prev: MasterItem[]) => MasterItem[])) => void;
    getAllMasters: () => MasterItem[];
    addOrUpdateMaster: (item: MasterItem) => void;
    isMasterDataLoaded: boolean;
}

// Create the context with a default undefined value
export const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

// Initial state for master data
const initialMasterData = Object.keys(MASTER_TYPES_CONFIG).reduce((acc, key) => {
    acc[key as MasterItemType] = [];
    return acc;
}, {} as Record<MasterItemType, MasterItem[]>);


const MASTER_DATA_KEY = 'masterData_v2';

// Create the provider component
export function MasterDataProvider({ children }: { children: ReactNode }) {
    const [data, setDataState] = useState<MasterData>(initialMasterData);
    const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(MASTER_DATA_KEY);
            let hydratedData = initialMasterData;

            if (savedData) {
                const parsedData = JSON.parse(savedData);
                hydratedData = { ...initialMasterData, ...parsedData };
            }
            
            // Ensure fixed items are always present
            const warehouseMap = new Map((hydratedData.Warehouse || []).map((item: MasterItem) => [item.id, item]));
            FIXED_WAREHOUSES.forEach(fixed => warehouseMap.set(fixed.id, fixed));
            hydratedData.Warehouse = Array.from(warehouseMap.values());
            
            const expenseMap = new Map((hydratedData.Expense || []).map((item: MasterItem) => [item.id, item]));
            FIXED_EXPENSES.forEach(fixed => expenseMap.set(fixed.id, fixed));
            hydratedData.Expense = Array.from(expenseMap.values());

            setDataState(hydratedData);
            
        } catch (error) {
            console.error("Error loading master data:", error);
            // Fallback to initial data if parsing fails
            setDataState(initialMasterData);
        } finally {
            setIsMasterDataLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isMasterDataLoaded) {
            localStorage.setItem(MASTER_DATA_KEY, JSON.stringify(data));
        }
    }, [data, isMasterDataLoaded]);
    
    const setData = useCallback((type: MasterItemType, updatedData: MasterItem[] | ((prev: MasterItem[]) => MasterItem[])) => {
        setDataState(prev => {
            const newArray = typeof updatedData === 'function' ? updatedData(prev[type]) : updatedData;
            return { ...prev, [type]: newArray };
        });
    }, []);

    const getAllMasters = useCallback((): MasterItem[] => {
        return Object.values(data).flat();
    }, [data]);
    
    const addOrUpdateMaster = useCallback((item: MasterItem) => {
        setData(item.type, (prev) => {
            const exists = prev.some(p => p.id === item.id);
            if(exists) {
                return prev.map(p => p.id === item.id ? item : p).sort((a,b) => a.name.localeCompare(b.name));
            }
            return [item, ...prev].sort((a,b) => a.name.localeCompare(b.name));
        });
    }, [setData]);

    const contextValue = useMemo(() => ({
        data,
        setData,
        getAllMasters,
        addOrUpdateMaster,
        isMasterDataLoaded,
    }), [data, setData, getAllMasters, addOrUpdateMaster, isMasterDataLoaded]);

    return (
        <MasterDataContext.Provider value={contextValue}>
            {children}
        </MasterDataContext.Provider>
    );
}

export function useMasterData() {
    const context = useContext(MasterDataContext);
    if (!context) {
        throw new Error('useMasterData must be used within a MasterDataProvider');
    }
    return context;
}
