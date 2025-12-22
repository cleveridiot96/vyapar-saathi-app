
"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Settings as SettingsIcon, Landmark, CalculatorIcon, LogOut, Text } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SearchBar from '@/components/shared/SearchBar';
import { Calculator } from '@/components/shared/Calculator';
import { useRouter } from 'next/navigation';
import { Slider } from "../ui/slider";
import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "../ui/label";
import { LowStockThresholdSetting } from './LowStockThresholdSetting';
import { FormatButton } from './FormatButton';
import { FinancialYearToggle } from './FinancialYearToggle';
import dynamic from "next/dynamic";

function AppHeaderContentInternal() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const router = useRouter();
  const { fontSize, setFontSize } = useSettings();

  const handleLogout = () => {
    router.push('/');
  }

  return (
    <>
      <Link href="/" aria-label="Dashboard">
        <Button variant="ghost" size="icon" aria-label="Home">
          <Home className="h-5 w-5 text-foreground" />
        </Button>
      </Link>
      <SearchBar />
      <FinancialYearToggle />
      <Link href="/financial-summary">
        <Button variant="outline">
            <Landmark className="mr-2 h-4 w-4"/>
            FINANCIAL SUMMARY
        </Button>
      </Link>
      <Button variant="ghost" size="icon" aria-label="Open Calculator" onClick={() => setIsCalculatorOpen(true)}>
        <CalculatorIcon className="h-5 w-5 text-foreground" />
      </Button>
      <Calculator isVisible={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
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
                      min={14}
                      max={24}
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
  );
}

export const AppHeaderContentInternalDynamic = dynamic(() => Promise.resolve(AppHeaderContentInternal), {
  ssr: false,
});
