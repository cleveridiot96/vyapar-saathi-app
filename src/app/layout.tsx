
"use client";

import type { Metadata } from 'next';
import { Poppins, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppExitHandler from '@/components/layout/AppExitHandler';
import React, from 'react';
import { AppStateContext, AppDispatchContext } from '@/hooks/useAppState';
import { useEventSourcedState } from '@/hooks/useEventSourcedState';
import type { MasterItem } from '@/lib/types';


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { state, dispatch } = useEventSourcedState();

  const getAllMasters = React.useCallback((): MasterItem[] => {
    if (!state.masterData) return [];
    return Object.values(state.masterData).flat();
  }, [state.masterData]);

  const contextValue = React.useMemo(() => ({
    ...state,
    getAllMasters,
  }), [state, getAllMasters]);


  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", poppins.variable, sourceCodePro.variable)} suppressHydrationWarning>
        <SettingsProvider>
          <AppStateContext.Provider value={contextValue}>
            <AppDispatchContext.Provider value={dispatch}>
              {children}
              <Toaster />
              <AppExitHandler />
            </AppDispatchContext.Provider>
          </AppStateContext.Provider>
        </SettingsProvider>
      </body>
    </html>
  );
}
