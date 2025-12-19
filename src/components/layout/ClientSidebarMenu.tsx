"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"; 
import type { Feature as NavItem } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { HelpCircle as FallbackIcon } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import React, { ComponentType, useEffect, useState } from "react";

const iconMap: Record<string, () => Promise<{ default: ComponentType<LucideProps> }>> = {
  LayoutDashboard: () => import('lucide-react').then(mod => ({ default: mod.LayoutDashboard })),
  ShoppingCart: () => import('lucide-react').then(mod => ({ default: mod.ShoppingCart })),
  ShoppingBag: () => import('lucide-react').then(mod => ({ default: mod.ShoppingBag })),
  Truck: () => import('lucide-react').then(mod => ({ default: mod.Truck })),
  Boxes: () => import('lucide-react').then(mod => ({ default: mod.Boxes })),
  BookOpenCheck: () => import('lucide-react').then(mod => ({ default: mod.BookOpenCheck })),
  CircleDollarSign: () => import('lucide-react').then(mod => ({ default: mod.CircleDollarSign })),
  ClipboardList: () => import('lucide-react').then(mod => ({ default: mod.ClipboardList })),
  BookUser: () => import('lucide-react').then(mod => ({ default: mod.BookUser })),
  PackageSearch: () => import('lucide-react').then(mod => ({ default: mod.PackageSearch })),
  PieChart: () => import('lucide-react').then(mod => ({ default: mod.PieChart })),
  BarChartHorizontal: () => import('lucide-react').then(mod => ({ default: mod.BarChartHorizontal })),
  ArrowRightLeft: () => import('lucide-react').then(mod => ({ default: mod.ArrowRightLeft })),
  Receipt: () => import('lucide-react').then(mod => ({ default: mod.Receipt })),
  CalendarDays: () => import('lucide-react').then(mod => ({ default: mod.CalendarDays })),
  Users: () => import('lucide-react').then(mod => ({ default: mod.Users })),
  DatabaseBackup: () => import('lucide-react').then(mod => ({ default: mod.DatabaseBackup })),
  SlidersHorizontal: () => import('lucide-react').then(mod => ({ default: mod.SlidersHorizontal })),
  Landmark: () => import('lucide-react').then(mod => ({ default: mod.Landmark })),
  Search: () => import('lucide-react').then(mod => ({ default: mod.Search })),
};


const LazyIcon = ({ name }: { name: string }) => {
    const [Icon, setIcon] = useState<ComponentType<LucideProps> | null>(null);

    useEffect(() => {
        const loadIcon = async () => {
            const iconLoader = iconMap[name];
            if (iconLoader) {
                try {
                    const { default: IconComponent } = await iconLoader();
                    setIcon(() => IconComponent);
                } catch (error) {
                    console.error(`Failed to load icon: ${name}`, error);
                    setIcon(() => FallbackIcon);
                }
            } else {
                setIcon(() => FallbackIcon);
            }
        };

        loadIcon();
    }, [name]);

    if (!Icon) {
        return <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />;
    }

    return <Icon className="h-5 w-5" />;
};


interface ClientSidebarMenuProps {
  navItems: NavItem[];
}

export function ClientSidebarMenu({ navItems }: ClientSidebarMenuProps) {
  const pathname = usePathname();
  const { state: sidebarState, setOpenMobile } = useSidebar(); 

  const handleLinkClick = () => {
    // Only close the sidebar on mobile after a navigation action
    if (setOpenMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <TooltipProvider>
      <SidebarMenu className="p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) || (pathname === "/" && item.href === "/dashboard");

          const buttonContent = (
            <>
              <div className={cn( // Icon circle
                  "flex items-center justify-center h-8 w-8 rounded-full shrink-0 transition-colors",
                  sidebarState === 'expanded' && "mr-3",
                   isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "bg-transparent text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
              )}>
                <LazyIcon name={item.iconName} />
              </div>
              <span className={cn( // Text
                  "truncate text-sm",
                  sidebarState === 'collapsed' && "sr-only", 
                  isActive ? "font-semibold" : "font-medium"
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
                    onClick={handleLinkClick} // Add this onClick handler
                    className={cn(
                      "relative flex items-center transition-colors duration-150 ease-in-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-background",
                      "text-sidebar-foreground hover:text-sidebar-accent-foreground rounded-md",
                      sidebarState === 'collapsed'
                        ? "w-10 h-10 justify-center" 
                        : "w-full justify-start px-2.5 py-2", 
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                        : "hover:bg-sidebar-accent/50"
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
