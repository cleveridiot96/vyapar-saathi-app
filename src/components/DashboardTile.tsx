"use client";

import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useMemo } from "react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ComponentType } from "react";

/**
 * LazyIcon loader - accepts lucide-export name (e.g. "Database") and dynamic-imports it.
 * This avoids bundling the whole icon set into initial JS.
 */
async function loadLucideIcon(name: string): Promise<ComponentType<LucideProps>> {
  try {
    // dynamic import from lucide-react. Vite/Next should tree-shake; dynamic import reduces initial bundle.
    const mod = await import("lucide-react");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mod as any)[name] ?? mod.HelpCircle;
  } catch (e) {
    // Fallback to HelpCircle if anything fails
    const mod = await import("lucide-react");
    return (mod as any).HelpCircle;
  }
}

interface DashboardTileProps {
  title: string;
  iconName: string; // lucide icon export name
  href?: string;
  description?: string;
  className?: string;
  style?: React.CSSProperties & Record<string, string | number | undefined>;
  onClick?: () => void;
  shortcut?: string;
}

const DashboardTileComponent: React.FC<DashboardTileProps> = ({ title, iconName, href, description, className, style, onClick, shortcut }) => {
  const [Icon, setIcon] = useState<ComponentType<LucideProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    // load icon asynchronously, but don't block rendering
    loadLucideIcon(iconName).then(iconComp => {
      if (mounted) setIcon(() => iconComp);
    });
    return () => { mounted = false; };
  }, [iconName]);

  const cardContent = useMemo(() => (
    <Card
      className={cn(
        "shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1",
        "rounded-xl p-3 flex flex-col items-center text-center justify-center h-full min-h-[120px]",
        "group-active:shadow-inner group-active:scale-95",
        "hover:shadow-[var(--shadow-color)]",
        className
      )}
      style={style}
    >
      {/* render icon placeholder until icon is loaded */}
      {Icon ? <Icon className="h-7 w-7 mb-2" /> : <div className="h-7 w-7 mb-2 rounded bg-muted animate-pulse" />}
      <CardTitle className="text-base font-semibold mb-1 uppercase">{title}</CardTitle>
      {description && <p className="text-xs opacity-80 uppercase">{description}</p>}
    </Card>
  ), [Icon, title, description, className, style]);

  let tileBody: React.ReactNode;
  if (onClick) {
    tileBody = (
      <button onClick={onClick} className="block group h-full w-full text-left focus:outline-none rounded-xl" type="button">
        {cardContent}
      </button>
    );
  } else if (href) {
    tileBody = (
      <Link href={href} className="block group h-full">
        {cardContent}
      </Link>
    );
  } else {
    tileBody = <div className="block group h-full">{cardContent}</div>;
  }

  if (!shortcut) return <>{tileBody}</>;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild><div className="h-full w-full">{tileBody}</div></TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{title}</p>
          {shortcut && (
            <p className="text-muted-foreground">
              Shortcut: <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">{shortcut}</kbd>
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const DashboardTile = React.memo(DashboardTileComponent);
