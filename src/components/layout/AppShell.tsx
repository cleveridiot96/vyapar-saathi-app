import React from "react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { navItems } from "@/lib/features";
import { ClientSidebarMenu } from "@/components/layout/ClientSidebarMenu";
import ErrorBoundary from "../ErrorBoundary";
import { cn } from "@/lib/utils";
import { RotatingHeaderText } from "./RotatingHeaderText";

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
                        "border-r border-sidebar-border shadow-lg print:hidden peer",
                        "bg-gradient-to-br from-green-900 via-green-800 to-green-900",
                        "bg-[length:200%_200%] animate-gradient"
                    )} 
                    style={{ animation: 'animate-gradient 15s ease infinite' }}
                    collapsible="icon"
                >
                    <SidebarHeader className="flex h-14 items-center justify-center p-2 border-b border-sidebar-border">
                       <RotatingHeaderText />
                    </SidebarHeader>
                    <SidebarContent className="py-2 overflow-y-auto thin-scrollbar">
                        <ClientSidebarMenu navItems={navItems.filter(f => f.href !== '/dashboard')} />
                    </SidebarContent>
                </Sidebar>

                <div className={cn(
                    "relative flex min-h-svh flex-1 flex-col bg-background transition-[margin-left] duration-200 ease-in-out",
                    "md:peer-data-[state=expanded]:ml-[--sidebar-width]",
                    "md:peer-data-[state=collapsed]:peer-data-[collapsible=icon]:ml-[--sidebar-width-icon]",
                )}>
                    <div className="flex flex-col flex-1 min-h-0 relative">
                        {header}
                        <main className="flex-1 overflow-y-auto p-2 sm:p-4 w-full print:p-0 print:m-0 print:overflow-visible">
                        <ErrorBoundary>{children}</ErrorBoundary>
                        </main>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}
