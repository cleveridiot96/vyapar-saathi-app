"use client"

import * as React from "react"
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { type DateRange, type SelectRangeEventHandler, DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "../ui/separator"

interface DatePickerProps {
  mode: "single" | "range"
  date: Date | DateRange | undefined
  onDateChange: (date: Date | DateRange | undefined) => void
  className?: string;
  disabled?: boolean;
}

const PRESETS = [
    { label: "Today", range: () => ({ from: new Date(), to: new Date() }) },
    { label: "Tomorrow", range: () => ({ from: addDays(new Date(), 1), to: addDays(new Date(), 1) }) },
    { label: "This weekend", range: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 6 }), to: endOfWeek(new Date(), { weekStartsOn: 6 }) }) },
    { label: "Next week", range: () => ({ from: addWeeks(new Date(), 1), to: addWeeks(new Date(), 1) }) },
];


export function DatePicker({
  className,
  date,
  onDateChange,
  mode = "single",
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | DateRange | undefined) => {
    onDateChange(selectedDate);
    if (mode === 'single' || (mode === 'range' && (selectedDate as DateRange)?.to)) {
      setOpen(false);
    }
  }

  const handlePresetClick = (getRange: () => DateRange) => {
    onDateChange(getRange());
    if (mode === 'single') {
        setOpen(false);
    }
  }

  const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDateChange(undefined);
  }
  
  const displayValue = () => {
    if (!date) return "Select date...";
    if (mode === 'single' && date instanceof Date) {
        return format(date, "LLL dd, y");
    }
    if (mode === 'range' && typeof date === 'object' && 'from' in date && 'to' in date) {
      if (date.from && date.to) {
        if(format(date.from, "LLL dd, y") === format(date.to, "LLL dd, y")) {
            return format(date.from, "LLL dd, y");
        }
        return `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`;
      }
      if (date.from) return format(date.from, "LLL dd, y");
    }
    return "Select date...";
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{displayValue()}</span>
            {date && <X className="ml-2 h-4 w-4 hover:text-destructive" onClick={handleClear}/>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="start">
            <div className="flex flex-col space-y-1 p-2 border-r">
                {PRESETS.map(({label, range}) => (
                    <Button key={label} variant="ghost" className="justify-start" onClick={() => handlePresetClick(range)}>{label}</Button>
                ))}
            </div>
            <Separator orientation="vertical" className="h-auto"/>
          <Calendar
            initialFocus
            mode={mode as "single" | "range"}
            defaultMonth={mode === 'range' ? (date as DateRange)?.from : (date as Date)}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={mode === 'range' ? 2 : 1}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
