
"use client";

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAppState, useAppDispatch, AppStateContext, AppDispatchContext } from '@/hooks/useAppState';
import { SettingsProvider } from '@/contexts/SettingsContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  
  return (
    <SettingsProvider>
      <AppStateContext.Provider value={state}>
        <AppDispatchContext.Provider value={dispatch}>
          <SidebarProvider>
              <AppShell header={<AppHeader />}>
                  {children}
              </AppShell>
          </SidebarProvider>
        </AppDispatchContext.Provider>
      </AppStateContext.Provider>
    </SettingsProvider>
  );
}
