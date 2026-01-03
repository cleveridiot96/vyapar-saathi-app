
"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, Lock } from "lucide-react";
import { AppHeaderContentInternalDynamic as AppHeaderContentInternal } from "@/components/layout/AppHeaderContentInternal";
import { useAuth } from "@/contexts/PasswordContext";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export function AppHeader() {
  const { lock } = useAuth();
  const router = useRouter();

  const handleLock = () => {
    lock();
    router.push('/login');
  };

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
          <Button variant="ghost" size="icon" aria-label="Lock App" onClick={handleLock}>
            <Lock className="h-5 w-5 text-destructive" />
          </Button>
        </div>
    </header>
  );
}
