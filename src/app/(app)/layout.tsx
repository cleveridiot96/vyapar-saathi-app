"use client";

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppHeader } from '@/components/layout/AppHeader';
import { PasswordProvider } from '@/contexts/PasswordContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PasswordProvider>
      <SettingsProvider>
        <AppShell header={<AppHeader />}>
            {children}
        </AppShell>
      </SettingsProvider>
    </PasswordProvider>
  );
}
