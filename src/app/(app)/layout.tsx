"use client";

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppHeader } from '@/components/layout/AppHeader';
import { PasswordProvider } from '@/contexts/PasswordContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PasswordProvider>
      <AppShell header={<AppHeader />}>
          {children}
      </AppShell>
    </PasswordProvider>
  );
}
