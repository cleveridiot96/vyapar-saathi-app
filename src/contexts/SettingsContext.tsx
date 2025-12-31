"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

interface PrintSettings {
  showProfitOnSaleChitti: boolean;
}

interface SettingsContextType {
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  
  financialYear: string;
  setFinancialYear: React.Dispatch<React.SetStateAction<string>>;
  availableFinancialYears: string[];
  setAvailableFinancialYears: React.Dispatch<React.SetStateAction<string[]>>;
  getNextFinancialYear: () => string;

  lowStockThreshold: number;
  setLowStockThreshold: React.Dispatch<React.SetStateAction<number>>;

  printSettings: PrintSettings;
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>;

  isAppHydrating: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function generateInitialFinancialYears() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  const endYear = currentMonth < 3 ? currentYear : currentYear + 1;
  const startYear = endYear - 1;
  
  const currentFY = `${startYear}-${endYear}`;
  
  const years = [currentFY];
  for (let i = 1; i <= 3; i++) {
    years.push(`${startYear - i}-${endYear - i}`);
  }
  return years.sort((a,b) => b.localeCompare(a));
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontSize, setFontSize] = useState<number>(16);
  const [financialYear, setFinancialYear] = useState<string>(() => generateInitialFinancialYears()[0]);
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>(generateInitialFinancialYears);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(50);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    showProfitOnSaleChitti: false,
  });

  const [isAppHydrating, setIsAppHydrating] = useState(true);

  useEffect(() => {
    // Since we're not using localStorage, hydration is effectively instant.
    setIsAppHydrating(false);
  }, []);

  useEffect(() => {
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
