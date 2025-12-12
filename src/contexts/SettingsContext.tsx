"use client";
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

interface PrintSettings {
  showProfitOnSaleChitti: boolean;
}

interface SettingsContextType {
  financialYear: string;
  setFinancialYear: (year: string) => void;
  isAppHydrating: boolean;
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  printSettings: PrintSettings;
  setPrintSettings: (settings: PrintSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isAppHydrating, setIsAppHydrating] = React.useState(true);
  const [financialYear, setFinancialYear] = useLocalStorageState('financialYear', '2023-2024');
  const [lowStockThreshold, setLowStockThreshold] = useLocalStorageState('lowStockThreshold', 10);
  const [fontSize, setFontSize] = useLocalStorageState('fontSize', 16);
  const [printSettings, setPrintSettings] = useLocalStorageState<PrintSettings>('printSettings', { showProfitOnSaleChitti: false });
  
  React.useEffect(() => {
    setIsAppHydrating(false);
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const handleSetFontSize = useCallback((size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  }, [setFontSize]);


  const value = {
    financialYear,
    setFinancialYear,
    isAppHydrating,
    lowStockThreshold,
    setLowStockThreshold,
    fontSize,
    setFontSize: handleSetFontSize,
    printSettings,
    setPrintSettings
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
