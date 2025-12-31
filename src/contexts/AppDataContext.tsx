"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { deriveAllTransactions, type DerivedTransactions } from '@/lib/derives';
import { loadEvents, onEventsChange, type TransactionEvent } from '@/lib/eventStore';

// The full application state, derived from events.
type AppData = Omit<DerivedTransactions, 'inventory'>;

interface AppDataContextType {
  appData: AppData | null;
  setAppData: React.Dispatch<React.SetStateAction<AppData | null>>;
  isLoaded: boolean;
  loadDataFromFile: (file: File) => Promise<void>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Initial data derivation from in-memory event store
    const handleEventChange = (events: TransactionEvent[]) => {
      const derivedData = deriveAllTransactions(events);
      setAppData(derivedData);
      if (!isLoaded) {
        setIsLoaded(true);
      }
    };
    
    // Subscribe to changes in the event store
    const unsubscribe = onEventsChange(handleEventChange);

    // Initial load
    handleEventChange([]); 

    return () => unsubscribe();
  }, [isLoaded]);

  const loadDataFromFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') {
            throw new Error("File is not readable");
          }
          const data = JSON.parse(text);

          if (data && Array.isArray(data.events)) {
            loadEvents(data.events as TransactionEvent[]); // This will trigger the onEventsChange listener
            setHasUnsavedChanges(false);
            resolve();
          } else {
            throw new Error("Invalid data format in file.");
          }
        } catch (error) {
          console.error("Failed to load data:", error);
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error("Could not read the selected file."));
      };
      reader.readAsText(file);
    });
  };

  const value = {
    appData,
    setAppData,
    isLoaded,
    loadDataFromFile,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
