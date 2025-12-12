"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { features } from "@/lib/features";
import { CommandMenu } from "@/components/command-menu";
import { Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [commandMenuOpen, setCommandMenuOpen] = React.useState(false);

  const currentFeature = features.find((feature) => pathname.startsWith(feature.href));
  const pageTitle = currentFeature ? currentFeature.title : "Vyapar Saathi";

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
            <Button variant="outline" className="gap-2" onClick={() => setCommandMenuOpen(true)}>
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">AI Assistant</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        </div>
      </header>
      <CommandMenu open={commandMenuOpen} setOpen={setCommandMenuOpen} />
    </>
  );
}
