"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

interface PrintSettings {
  showProfitOnSaleChitti: boolean;
}

interface SettingsContextType {
  // Font Size
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  
  // Financial Year
  financialYear: string;
  setFinancialYear: React.Dispatch<React.SetStateAction<string>>;
  availableFinancialYears: string[];
  setAvailableFinancialYears: React.Dispatch<React.SetStateAction<string[]>>;
  getNextFinancialYear: () => string;

  // Stock Threshold
  lowStockThreshold: number;
  setLowStockThreshold: React.Dispatch<React.SetStateAction<number>>;

  // Print Settings
  printSettings: PrintSettings;
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>;

  // App Hydration Status
  isAppHydrating: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function generateInitialFinancialYears() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  // If we are in Jan, Feb, March, the current FY is (last year)-(current year)
  // Otherwise, it's (current year)-(next year)
  const endYear = currentMonth < 3 ? currentYear : currentYear + 1;
  const startYear = endYear - 1;
  
  const currentFY = `${startYear}-${endYear}`;
  
  // Generate a few past years for initial setup
  const years = [currentFY];
  for (let i = 1; i <= 3; i++) {
    years.push(`${startYear - i}-${endYear - i}`);
  }
  return years.sort((a,b) => b.localeCompare(a));
}


export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontSize, setFontSize, isFontSizeHydrating] = useLocalStorageState<number>('app-font-size', 16);
  
  const [financialYear, setFinancialYear, isFyHydrating] = useLocalStorageState<string>('app-financial-year', () => {
      const years = generateInitialFinancialYears();
      return years[0];
  });
  
  const [availableFinancialYears, setAvailableFinancialYears, isAvailFyHydrating] = useLocalStorageState<string[]>('app-available-financial-years', generateInitialFinancialYears);

  const [lowStockThreshold, setLowStockThreshold, isThresholdHydrating] = useLocalStorageState<number>('app-low-stock-threshold', 50);

  const [printSettings, setPrintSettings, isPrintSettingsHydrating] = useLocalStorageState<PrintSettings>('app-print-settings', {
    showProfitOnSaleChitti: false,
  });

  const isAppHydrating = isFontSizeHydrating || isFyHydrating || isAvailFyHydrating || isThresholdHydrating || isPrintSettingsHydrating;

  React.useEffect(() => {
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
  }, [fontSize]);

  const getNextFinancialYear = () => {
    const latestYear = availableFinancialYears.sort((a, b) => b.localeCompare(a))[0];
    const [startYearStr] = latestYear.split('-');
    const startYear = parseInt(startYearStr, 10);
    return `${startYear + 1}-${startYear + 2}`;
  };

  const value = useMemo(() => ({
    fontSize, setFontSize,
    financialYear, setFinancialYear,
    availableFinancialYears, setAvailableFinancialYears,
    getNextFinancialYear,
    lowStockThreshold, setLowStockThreshold,
    printSettings, setPrintSettings,
    isAppHydrating,
  }), [
    fontSize, setFontSize,
    financialYear, setFinancialYear,
    availableFinancialYears, setAvailableFinancialYears,
    lowStockThreshold, setLowStockThreshold,
    printSettings, setPrintSettings,
    isAppHydrating,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// A specific hook for Financial Year to avoid unnecessary re-renders in components that don't need the whole settings context
export const useFinancialYear = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useFinancialYear must be used within a SettingsProvider');
    }
    return useMemo(() => ({
        financialYear: context.financialYear,
        setFinancialYear: context.setFinancialYear,
        availableFinancialYears: context.availableFinancialYears,
        setAvailableFinancialYears: context.setAvailableFinancialYears,
        getNextFinancialYear: context.getNextFinancialYear,
    }), [context.financialYear, context.setFinancialYear, context.availableFinancialYears, context.setAvailableFinancialYears, context.getNextFinancialYear]);
}
