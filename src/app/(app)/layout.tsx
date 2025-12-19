"use client";

import React from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TransactionsProvider } from '@/hooks/useTransactions';
import { AppShell } from '@/components/layout/AppShell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { MasterDataProvider } from '@/contexts/MasterDataContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <MasterDataProvider>
        <TransactionsProvider>
          <SidebarProvider>
              <AppShell header={<AppHeader />}>
                  {children}
              </AppShell>
          </SidebarProvider>
        </TransactionsProvider>
      </MasterDataProvider>
    </SettingsProvider>
  );
}
