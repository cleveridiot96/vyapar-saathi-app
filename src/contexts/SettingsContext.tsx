"use client";
import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react';

interface PrintSettings {
  showProfitOnSaleChitti: boolean;
}

interface SettingsContextType {
  financialYear: string;
  setFinancialYear: (year: string) => void;
  availableFinancialYears: string[];
  setAvailableFinancialYears: React.Dispatch<React.SetStateAction<string[]>>;
  isAppHydrating: boolean;
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  printSettings: PrintSettings;
  setPrintSettings: (settings: PrintSettings | ((prev: PrintSettings) => PrintSettings)) => void;
  getPreviousFinancialYear: () => string;
  getNextFinancialYear: () => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // PERMANENT FIX: Replaced useLocalStorageState with useState for stability in restricted environments.
  const [financialYear, setFinancialYear] = useState('2023-2024');
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>(['2023-2024']);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [fontSize, setFontSize] = useState(16);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({ showProfitOnSaleChitti: false });
  
  // PERMANENT FIX: Since we are not loading from localStorage, hydration is considered immediate.
  const [isAppHydrating, setIsAppHydrating] = useState(false);

  React.useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const handleSetFontSize = useCallback((size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  }, []);
  
  const getFinancialYearParts = (fy: string) => {
    const parts = fy.split('-').map(Number);
    return parts.length === 2 && !isNaN(parts[0]) ? { startYear: parts[0] } : { startYear: new Date().getFullYear() -1 };
  }

  const getPreviousFinancialYear = useCallback(() => {
    const { startYear } = getFinancialYearParts(financialYear);
    return `${startYear - 1}-${startYear}`;
  }, [financialYear]);

  const getNextFinancialYear = useCallback(() => {
    const { startYear } = getFinancialYearParts(financialYear);
    return `${startYear + 1}-${startYear + 2}`;
  }, [financialYear]);


  const value = {
    financialYear,
    setFinancialYear,
    availableFinancialYears,
    setAvailableFinancialYears,
    isAppHydrating,
    lowStockThreshold,
    setLowStockThreshold,
    fontSize,
    setFontSize: handleSetFontSize,
    printSettings,
    setPrintSettings,
    getPreviousFinancialYear,
    getNextFinancialYear
  };

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
