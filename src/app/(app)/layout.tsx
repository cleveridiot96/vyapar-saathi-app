"use client";

import React from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TransactionsProvider } from '@/hooks/useTransactions';
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <TransactionsProvider>
          <AppShell>{children}</AppShell>
      </TransactionsProvider>
    </SettingsProvider>
  );
}
