"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import type { MasterItem, MasterItemType } from '@/lib/types';
import { MASTER_TYPES_CONFIG } from '@/lib/constants';

interface MasterDataContextType {
  data: Record<MasterItemType, MasterItem[]>;
  setData: (type: MasterItemType, value: MasterItem[] | ((prev: MasterItem[]) => MasterItem[])) => void;
  getAllMasters: () => MasterItem[];
  getMastersByType: (type: MasterItemType) => MasterItem[];
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

const initialMasterData = Object.keys(MASTER_TYPES_CONFIG).reduce((acc, key) => {
    acc[key as MasterItemType] = [];
    return acc;
}, {} as Record<MasterItemType, MasterItem[]>);

export function MasterDataProvider({ children }: { children: ReactNode }) {
    const [masterData, setMasterData] = useLocalStorageState('masterDataV2', initialMasterData);

    const setData = useCallback((type: MasterItemType, value: MasterItem[] | ((prev: MasterItem[]) => MasterItem[])) => {
        setMasterData(prev => {
            const newItems = typeof value === 'function' ? value(prev[type] || []) : value;
            return { ...prev, [type]: newItems };
        });
    }, [setMasterData]);

    const getAllMasters = useCallback(() => {
        return Object.values(masterData).flat();
    }, [masterData]);
    
    const getMastersByType = useCallback((type: MasterItemType) => {
        return masterData[type] || [];
    }, [masterData]);

    const value = { data: masterData, setData, getAllMasters, getMastersByType };

    return (
        <MasterDataContext.Provider value={value}>
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
