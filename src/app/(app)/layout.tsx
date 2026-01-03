"use client";

import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/PasswordContext';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/hooks/useHydrated';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const isHydrated = useHydrated();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router, isHydrated]);

  if (!isHydrated || !isAuthenticated) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading application data...</p>
        </div>
    );
  }

  return (
    <AppShell header={<AppHeader />}>
        {children}
    </AppShell>
  );
}
