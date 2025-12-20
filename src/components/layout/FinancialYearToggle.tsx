
"use client";

import React from 'react';
import { useFinancialYear } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus } from 'lucide-react';
import { useHydrated } from '@/hooks/useHydrated';

export function FinancialYearToggle() {
  const { 
    financialYear, 
    setFinancialYear, 
    availableFinancialYears,
    setAvailableFinancialYears,
    getNextFinancialYear 
  } = useFinancialYear();
  const { toast } = useToast();
  const isHydrated = useHydrated();

  const handleAddNextFinancialYear = () => {
    const nextFy = getNextFinancialYear();
    if (!availableFinancialYears.includes(nextFy)) {
      const updatedYears = [...availableFinancialYears, nextFy].sort((a,b) => b.localeCompare(a));
      setAvailableFinancialYears(updatedYears);
      setFinancialYear(nextFy);
      toast({
        title: "New Financial Year Added",
        description: `Switched to FY ${nextFy}.`,
      });
    } else {
      setFinancialYear(nextFy);
      toast({
        title: "Switched Financial Year",
        description: `Now viewing FY ${nextFy}.`,
      });
    }
  };
  
  const handleYearSelect = (year: string) => {
    setFinancialYear(year);
  };

  const sortedYearOptions = React.useMemo(() => {
    return [...availableFinancialYears].sort((a,b) => b.localeCompare(a));
  }, [availableFinancialYears]);

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="px-3 text-sm font-semibold whitespace-nowrap w-[110px]">
            FY {isHydrated ? financialYear : '...'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-[200px]">
          <DropdownMenuLabel>Select Financial Year</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={financialYear} onValueChange={handleYearSelect}>
            {sortedYearOptions.map(year => (
              <DropdownMenuRadioItem 
                key={year} 
                value={year}
              >
                {year}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAddNextFinancialYear} className="text-primary hover:!text-primary-foreground hover:!bg-primary">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Add Next FY ({getNextFinancialYear()})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
