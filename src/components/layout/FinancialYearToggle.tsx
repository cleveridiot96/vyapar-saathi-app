"use client";
import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from 'lucide-react';

const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
        const startYear = currentYear - i;
        const endYear = startYear + 1;
        years.push(`${startYear}-${endYear}`);
    }
    return years;
}

export function FinancialYearToggle() {
    const { financialYear, setFinancialYear } = useSettings();
    const years = generateFinancialYears();
    
    return (
       <Select value={financialYear} onValueChange={setFinancialYear}>
          <SelectTrigger className="w-auto sm:w-[180px] h-9 text-xs sm:text-sm">
             <div className="flex items-center gap-2">
               <Calendar className="h-4 w-4" />
               <SelectValue placeholder="Select FY" />
             </div>
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
                <SelectItem key={year} value={year}>FY {year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
    )
}
