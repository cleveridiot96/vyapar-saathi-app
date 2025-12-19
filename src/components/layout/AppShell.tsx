"use client";

import React from "react";
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent } from "@/components/ui/sidebar";
import { features } from "@/lib/features";
import { Menu, Loader } from "lucide-react";
import { ClientSidebarMenu } from "@/components/layout/ClientSidebarMenu";
import { AppHeaderContentInternal } from "@/components/layout/AppHeader";
import { useHydrated } from "@/hooks/useHydrated";
import { useTransactions } from "@/hooks/useTransactions";
import ErrorBoundary from "../ErrorBoundary";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHydrated = useHydrated();
    const { isTransactionsLoaded, isMasterDataLoaded } = useTransactions();
    
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/setup') || pathname.startsWith('/recover');

    if (isAuthPage) {
        return <>{children}</>;
    }
    
    if (!isHydrated || !isTransactionsLoaded || !isMasterDataLoaded) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-semibold text-muted-foreground">
                        Loading Application Data...
                    </p>
                </div>
            </div>
        );
    }
    
    // Fully loaded UI shell
    return (
        <div className="flex h-screen w-screen overflow-hidden">
            <Sidebar className="border-r border-sidebar-border shadow-lg print:hidden" collapsible="icon">
                <SidebarHeader className="flex h-14 items-center justify-center p-2 border-b border-sidebar-border">
                    <SidebarTrigger>
                        <Menu className="h-6 w-6 text-sidebar-foreground" />
                    </SidebarTrigger>
                </SidebarHeader>
                <SidebarContent className="py-2">
                    <ClientSidebarMenu navItems={features} />
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <div className="flex flex-col flex-1 min-h-0 relative">
                    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 shadow-sm print:hidden">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="md:hidden -ml-2">
                                <Menu className="h-6 w-6 text-foreground" />
                            </SidebarTrigger>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                            <AppHeaderContentInternal />
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-2 sm:p-4 w-full print:p-0 print:m-0 print:overflow-visible">
                       <ErrorBoundary>{children}</ErrorBoundary>
                    </main>
                </div>
            </SidebarInset>
        </div>
    );
}
