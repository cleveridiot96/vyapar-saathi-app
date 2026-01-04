"use client";

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppHeader } from '@/components/layout/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={<AppHeader />}>
        {children}
    </AppShell>
  );
}
