
"use client";

import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/PasswordContext';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/hooks/useHydrated';

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
    // You can render a loading spinner here while checking auth state
    return (
        <div className="flex items-center justify-center h-screen">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <AppShell header={<AppHeader />}>
        {children}
    </AppShell>
  );
}
