"use client";
import React, { createContext, useContext, ReactNode, useCallback, useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

interface PrintSettings {
  showProfitOnSaleChitti: boolean;
}

// Separating FinancialYear context
interface FinancialYearContextType {
  financialYear: string;
  setFinancialYear: (year: string) => void;
  availableFinancialYears: string[];
  setAvailableFinancialYears: React.Dispatch<React.SetStateAction<string[]>>;
  getPreviousFinancialYear: () => string;
  getNextFinancialYear: () => string;
}

const FinancialYearContext = createContext<FinancialYearContextType | undefined>(undefined);

export function FinancialYearProvider({ children }: { children: ReactNode }) {
  const [financialYear, setFinancialYear] = useLocalStorageState('financialYear', '2023-2024');
  const [availableFinancialYears, setAvailableFinancialYears] = useLocalStorageState<string[]>('availableFinancialYears', ['2023-2024']);
  
  const getFinancialYearParts = (fy: string) => {
    const parts = fy.split('-').map(Number);
    return parts.length === 2 && !isNaN(parts[0]) ? { startYear: parts[0] } : { startYear: new Date().getFullYear() - 1 };
  }

  const getPreviousFinancialYear = useCallback(() => {
    const { startYear } = getFinancialYearParts(financialYear);
    return `${startYear - 1}-${startYear}`;
  }, [financialYear]);

  const getNextFinancialYear = useCallback(() => {
    const { startYear } = getFinancialYearParts(financialYear);
    return `${startYear + 1}-${startYear + 2}`;
  }, [financialYear]);

  const value = useMemo(() => ({
    financialYear,
    setFinancialYear,
    availableFinancialYears,
    setAvailableFinancialYears,
    getPreviousFinancialYear,
    getNextFinancialYear
  }), [financialYear, setFinancialYear, availableFinancialYears, setAvailableFinancialYears, getPreviousFinancialYear, getNextFinancialYear]);

  return (
    <FinancialYearContext.Provider value={value}>
      {children}
    </FinancialYearContext.Provider>
  );
}

export function useFinancialYear() {
  const context = useContext(FinancialYearContext);
  if (context === undefined) {
    throw new Error('useFinancialYear must be used within a FinancialYearProvider');
  }
  return context;
}


// General Settings Context
interface SettingsContextType {
  isAppHydrating: boolean;
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  printSettings: PrintSettings;
  setPrintSettings: (settings: PrintSettings | ((prev: PrintSettings) => PrintSettings)) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lowStockThreshold, setLowStockThreshold, isThresholdHydrating] = useLocalStorageState('lowStockThreshold', 10);
  const [fontSize, setFontSize, isFontSizeHydrating] = useLocalStorageState('fontSize', 16);
  const [printSettings, setPrintSettings, isPrintSettingsHydrating] = useLocalStorageState<PrintSettings>('printSettings', { showProfitOnSaleChitti: false });
  
  const isAppHydrating = isThresholdHydrating || isFontSizeHydrating || isPrintSettingsHydrating;

  React.useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
  }, [fontSize]);

  const handleSetFontSize = useCallback((size: number) => {
    setFontSize(size);
  }, [setFontSize]);

  const value = useMemo(() => ({
    isAppHydrating,
    lowStockThreshold,
    setLowStockThreshold,
    fontSize,
    setFontSize: handleSetFontSize,
    printSettings,
    setPrintSettings,
  }), [
    isAppHydrating, lowStockThreshold, setLowStockThreshold, fontSize, handleSetFontSize,
    printSettings, setPrintSettings
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
