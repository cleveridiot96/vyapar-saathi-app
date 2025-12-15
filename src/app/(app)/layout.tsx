
"use client";
import { usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { AppHeaderContentInternal } from '@/components/layout/AppHeader';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TransactionsProvider } from '@/hooks/useTransactions';
import { MasterDataProvider } from '@/contexts/MasterDataContext';
import { features, type Feature } from '@/lib/features';
import { cn } from '@/lib/utils';
import React from 'react';

const getThemeClassForPath = (path: string): string => {
  const feature = features.find(f => path.startsWith(f.href));
  if (!feature) return 'theme-blue'; // Default theme

  const title = feature.title.toLowerCase();
  if (title.includes('purchase')) return 'theme-green';
  if (title.includes('sale')) return 'theme-red';
  if (title.includes('inventory')) return 'theme-purple';
  if (title.includes('outstanding')) return 'theme-pink';
  if (title.includes('cash book')) return 'theme-teal';
  if (title.includes('payment')) return 'theme-orange';
  if (title.includes('receipt')) return 'theme-yellow'; // Assuming yellow for receipts
  // Add more mappings as needed
  return 'theme-blue'; // Fallback
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const themeClass = React.useMemo(() => getThemeClassForPath(pathname), [pathname]);

  return (
    <SettingsProvider>
      <TransactionsProvider>
        <MasterDataProvider>
          <SidebarProvider>
            <Sidebar>
              <SidebarNav />
            </Sidebar>
            <SidebarInset className={cn(themeClass)}>
              <AppHeaderContentInternal />
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                  {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </MasterDataProvider>
      </TransactionsProvider>
    </SettingsProvider>
  );
}
