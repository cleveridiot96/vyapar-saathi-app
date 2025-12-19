"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { AppHeaderContentInternal } from "@/components/layout/AppHeaderContentInternal";

export function AppHeader() {
  return (
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
  );
}
