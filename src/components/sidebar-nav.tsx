
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { features } from '@/lib/features';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-foreground"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </div>
            <div className="flex flex-col">
                <h2 className="text-lg font-semibold tracking-tight">Vyapar Saathi</h2>
                <p className="text-xs text-muted-foreground">Business Companion</p>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {features.map((feature) => {
            const isActive = pathname.startsWith(feature.href);
            return (
              <SidebarMenuItem key={feature.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={feature.title}
                    className={cn(
                      "relative overflow-hidden",
                      isActive && "shadow-lg"
                    )}
                    style={isActive ? {
                      backgroundImage: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
                      color: feature.textColor,
                      boxShadow: feature.shadow,
                    } : {}}
                  >
                    <Link href={feature.href}>
                      {isActive && <div className="absolute inset-0 rounded-md bg-black/[.08] backdrop-blur-sm" />}
                      <feature.icon />
                      <span>{feature.title}</span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="User" />
            <AvatarFallback>VS</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-medium">Demo User</p>
            <p className="truncate text-xs text-muted-foreground">demo@vyaparsaathi.com</p>
          </div>
          <Button variant="ghost" size="icon" className='h-8 w-8'>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
