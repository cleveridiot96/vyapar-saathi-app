"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"; 
import type { StyledNavItem as NavItem } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import React from "react";
import {
  LayoutDashboard, ShoppingCart, ShoppingBag, Truck, Boxes, BookOpenCheck,
  CircleDollarSign, ClipboardList, BookUser, PackageSearch, PieChart,
  BarChartHorizontal, ArrowRightLeft, Receipt, CalendarDays, Users,
  DatabaseBackup, SlidersHorizontal, Landmark, Search, HelpCircle as FallbackIcon, BookCopy, Layers, Rocket, BookOpen, BookMarked
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useHydrated } from "@/hooks/useHydrated";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  LayoutDashboard, ShoppingCart, ShoppingBag, Truck, Boxes, BookOpenCheck,
  CircleDollarSign, ClipboardList, BookUser, PackageSearch, PieChart,
  BarChartHorizontal, ArrowRightLeft, Receipt, CalendarDays, Users,
  DatabaseBackup, SlidersHorizontal, Landmark, Search, BookCopy, Layers, Rocket, BookOpen, BookMarked
};

export const LazyIcon = ({ name }: { name: string }) => {
    const Icon = iconMap[name] || FallbackIcon;
    return <Icon className="h-5 w-5" />;
};


interface ClientSidebarMenuProps {
  navItems: NavItem[];
}

export function ClientSidebarMenu({ navItems }: ClientSidebarMenuProps) {
  const pathname = usePathname();
  const { state: sidebarState, setOpenMobile } = useSidebar(); 
  const isHydrated = useHydrated();

  const handleLinkClick = () => {
    if (setOpenMobile) {
      setOpenMobile(false);
    }
  };
  
  if (!isHydrated) {
    return (
        <SidebarMenu className="p-2 space-y-0.5">
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                     <div className="flex items-center w-full justify-start px-2.5 py-2 h-10">
                        <div className="h-8 w-8 rounded-full mr-3 shrink-0 bg-muted/50 animate-pulse"></div>
                        <div className="h-4 w-3/4 rounded bg-muted/50 animate-pulse"></div>
                     </div>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
  }

  return (
    <TooltipProvider>
      <SidebarMenu className="p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) || (pathname === "/" && item.href === "/dashboard");

          const buttonContent = (
            <>
              <div className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full shrink-0 transition-colors",
                  sidebarState === 'expanded' && "mr-3",
                   isActive 
                    ? "bg-primary text-primary-foreground"
                    : "bg-sidebar-primary/20 text-sidebar-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground"
              )}>
                <LazyIcon name={item.iconName} />
              </div>
              <span className={cn(
                  "truncate text-sm font-medium",
                  sidebarState === 'collapsed' && "sr-only"
              )}>
                {item.title}
              </span>
            </>
          );
          
          return (
            <SidebarMenuItem key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "relative flex items-center transition-colors duration-150 ease-in-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-background rounded-md",
                      sidebarState === 'collapsed'
                        ? "w-10 h-10 justify-center" 
                        : "w-full justify-start px-2.5 py-2", 
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md hover:shadow-lg transform hover:-translate-y-px"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {buttonContent}
                  </Link>
                </TooltipTrigger>
                  <TooltipContent side="right" align="center" className="ml-1">
                    <p>{item.title}</p>
                    {item.shortcut && (
                      <p className="mt-1">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">{item.shortcut}</kbd>
                      </p>
                    )}
                  </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </TooltipProvider>
  );
}
