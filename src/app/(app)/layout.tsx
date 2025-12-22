"use client";

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppShell header={<AppHeader />}>
            {children}
        </AppShell>
    </SidebarProvider>
  );
}
