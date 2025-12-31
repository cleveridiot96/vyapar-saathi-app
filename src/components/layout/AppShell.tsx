import React from "react";
import { Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { navItems } from "@/lib/features";
import { ClientSidebarMenu } from "@/components/layout/ClientSidebarMenu";
import ErrorBoundary from "../ErrorBoundary";
import { cn } from "@/lib/utils";

export function AppShell({ 
    header,
    children 
}: { 
    header: React.ReactNode;
    children: React.ReactNode 
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
                <Sidebar 
                    className={cn(
                        "border-r border-sidebar-border shadow-lg print:hidden",
                        "bg-gradient-to-br from-green-900 via-green-800 to-green-900",
                        "bg-[length:200%_200%] animate-gradient"
                    )} 
                    style={{ animation: 'animate-gradient 15s ease infinite' }}
                    collapsible="icon"
                >
                    <SidebarHeader className="flex h-14 items-center justify-center p-2 border-b border-sidebar-border">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-sidebar-foreground"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            <h2 className="text-lg font-semibold tracking-tight text-sidebar-foreground">Vyapar Saathi</h2>
                        </div>
                    </SidebarHeader>
                    <SidebarContent className="py-2 overflow-y-auto thin-scrollbar">
                        <ClientSidebarMenu navItems={navItems.filter(f => f.href !== '/dashboard')} />
                    </SidebarContent>
                </Sidebar>

                <SidebarInset>
                    <div className="flex flex-col flex-1 min-h-0 relative">
                        {header}
                        <main className="flex-1 overflow-y-auto p-2 sm:p-4 w-full print:p-0 print:m-0 print:overflow-visible">
                        <ErrorBoundary>{children}</ErrorBoundary>
                        </main>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
