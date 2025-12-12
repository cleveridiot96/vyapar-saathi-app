import { SidebarProvider, Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Header } from '@/components/header';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TransactionsProvider } from '@/hooks/useTransactions.tsx';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <TransactionsProvider>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarRail />
            <SidebarNav />
          </Sidebar>
          <SidebarInset>
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TransactionsProvider>
    </SettingsProvider>
  );
}
