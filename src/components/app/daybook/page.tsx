"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePicker } from "@/components/shared/DatePicker";
import { Button } from "@/components/ui/button";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";

export default function DaybookPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daybook</CardTitle>
        <CardDescription>Displays all daily entries and transactions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            <DatePicker mode="range" date={dateRange} onDateChange={setDateRange} />
        </div>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
    