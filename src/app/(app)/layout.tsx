"use client";

import React from 'react';
import { SettingsProvider, FinancialYearProvider } from '@/contexts/SettingsContext';
import { TransactionsProvider } from '@/hooks/useTransactions';
import { AppShell } from '@/components/layout/AppShell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <FinancialYearProvider>
        <TransactionsProvider>
          <SidebarProvider>
              <AppShell header={<AppHeader />}>
                  {children}
              </AppShell>
          </SidebarProvider>
        </TransactionsProvider>
      </FinancialYearProvider>
    </SettingsProvider>
  );
}
