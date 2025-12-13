import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { AppHeaderContentInternal } from '@/components/layout/AppHeader';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TransactionsProvider } from '@/hooks/useTransactions';
import { MasterDataProvider } from '@/contexts/MasterDataContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <MasterDataProvider>
        <TransactionsProvider>
          <SidebarProvider>
            <Sidebar>
              <SidebarNav />
            </Sidebar>
            <SidebarInset>
              <AppHeaderContentInternal />
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                  {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TransactionsProvider>
      </MasterDataProvider>
    </SettingsProvider>
  );
}
