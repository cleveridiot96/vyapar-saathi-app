
"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { AppHeaderContentInternalDynamic as AppHeaderContentInternal } from "@/components/layout/AppHeaderContentInternal";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4 print:hidden shadow-sm">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="hidden md:flex">
                <Menu className="h-6 w-6 text-foreground" />
            </SidebarTrigger>
            <SidebarTrigger className="md:hidden -ml-2">
                <Menu className="h-6 w-6 text-foreground" />
            </SidebarTrigger>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <AppHeaderContentInternal />
        </div>
    </header>
  );
}
