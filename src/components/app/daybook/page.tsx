"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/shared/DatePickerWithRange";
import { Button } from "@/components/ui/button";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, subMonths, subWeeks, startOfYear } from "date-fns";

export default function DaybookPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const setDatePreset = (preset: 'ytd' | '6m' | '3m' | '1m' | '1w' | 'today') => {
    const to = endOfDay(new Date());
    let from;
    switch (preset) {
        case 'ytd': from = startOfYear(to); break;
        case '6m': from = startOfDay(subMonths(to, 6)); break;
        case '3m': from = startOfDay(subMonths(to, 3)); break;
        case '1m': from = startOfDay(subMonths(to, 1)); break;
        case '1w': from = startOfDay(subWeeks(to, 1)); break;
        case 'today': from = startOfDay(to); break;
    }
    setDateRange({ from, to });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daybook</CardTitle>
        <CardDescription>Displays all daily entries and transactions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('1w')}>1W</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('1m')}>1M</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('3m')}>3M</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('6m')}>6M</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('ytd')}>YTD</Button>
            </div>
        </div>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
    