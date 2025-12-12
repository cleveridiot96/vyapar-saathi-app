"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { Home, Settings as SettingsIcon, Landmark, CalculatorIcon, LogOut, Text } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SearchBar from '@/components/shared/SearchBar';
import { Calculator } from '@/components/shared/Calculator';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';
import { Slider } from "../ui/slider";
import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "../ui/label";
import { CommandMenu } from '../command-menu';
import { Sparkles } from 'lucide-react';
import { LowStockThresholdSetting } from './LowStockThresholdSetting';
import { FormatButton } from './FormatButton';
import { useHydrated } from '@/hooks/useHydrated';


export function AppHeaderContentInternal() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const router = useRouter();
  const { fontSize, setFontSize } = useSettings();
  const isHydrated = useHydrated();

  const handleLogout = () => {
    // In a real app, this would involve clearing tokens, etc.
    router.push('/');
  }

  return (
    <>
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
       <SidebarTrigger className="sm:hidden" />
       <SidebarTrigger className="hidden sm:flex" />
        <div className="flex items-center gap-2">
            <Link href="/dashboard" aria-label="Dashboard">
              <Button variant="ghost" size="icon" aria-label="Home">
                <Home className="h-5 w-5 text-foreground" />
              </Button>
            </Link>
        </div>
      <div className="flex flex-1 items-center gap-x-4 sm:gap-x-6">
        <SearchBar />
        <div className="ml-auto flex items-center gap-x-2 sm:gap-x-4">
           {isHydrated && (
            <>
              <Link href="/financial-summary">
                <Button variant="outline" className="hidden sm:flex">
                    <Landmark className="mr-2 h-4 w-4"/>
                    Financial Summary
                </Button>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Open Calculator" onClick={() => setIsCalculatorOpen(true)}>
                <CalculatorIcon className="h-5 w-5 text-foreground" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Settings">
                    <SettingsIcon className="h-5 w-5 text-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4" align="end">
                  <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Text className="h-4 w-4" /> Font Size
                      </Label>
                      <div className="flex items-center gap-4">
                          <span className="text-xs">A</span>
                          <Slider
                              min={12}
                              max={20}
                              step={1}
                              value={[fontSize]}
                              onValueChange={(value) => setFontSize(value[0])}
                          />
                          <span className="text-xl">A</span>
                      </div>
                  </div>
                  <LowStockThresholdSetting />
                  <FormatButton />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-destructive" />
              </Button>
            </>
           )}
        </div>
      </div>
      
       {isHydrated && (
        <>
            <Calculator isVisible={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        </>
       )}

    </header>
    </>
  );
}
