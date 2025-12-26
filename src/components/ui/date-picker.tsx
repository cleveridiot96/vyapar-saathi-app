
"use client";

import * as React from "react";
import { format, parse, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./input";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>("");

  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "dd/MM/yy"));
    } else {
      setInputValue("");
    }
  }, [date]);
  
  const handleSelect = (selectedDate: Date | undefined) => {
      onDateChange(selectedDate);
  }

  const handleCancel = () => {
    onDateChange(undefined);
    setOpen(false);
  }

  const handleOk = () => {
    setOpen(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const parseDateString = (str: string): Date | null => {
      if (!str) return null;

      // Replace common separators with a slash
      const normalizedStr = str.replace(/[.\-,\s]/g, '/');

      // Attempt to parse different formats
      const formats = [
          'dd/MM/yy',
          'd/M/yy',
          'dd/MM/yyyy',
          'd/M/yyyy',
          'd/M',
          'dd/MM',
      ];
      
      const now = new Date();

      for (const fmt of formats) {
          const parsedDate = parse(normalizedStr, fmt, now);
          if (!isNaN(parsedDate.getTime())) {
              return parsedDate;
          }
      }
      return null;
  };

  const handleInputBlur = () => {
    const parsed = parseDateString(inputValue);
    if (parsed) {
        onDateChange(parsed);
        setInputValue(format(parsed, "dd/MM/yy"));
    } else {
        // If parsing fails, revert to the last valid date or clear it
        if(date) {
            setInputValue(format(date, "dd/MM/yy"));
        } else {
            setInputValue("");
        }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className={cn("relative w-full", className)}>
            <Input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={() => setOpen(true)}
                disabled={disabled}
                className="w-full justify-start text-left font-normal"
            />
             <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[100] rounded-lg shadow-2xl bg-card" 
        align="start"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="p-4 bg-primary/10 rounded-t-lg">
            <div className="text-xs text-primary uppercase">Select Date</div>
            <div className="flex justify-between items-center">
                 <div className="text-2xl font-bold text-primary">
                    {date ? format(date, "EEE, MMM d") : "No date selected"}
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4"/>
                 </Button>
            </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => d < startOfToday()}
          initialFocus
          fromYear={2015}
          toYear={2035}
          captionLayout="dropdown-nav"
        />
        <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleOk}>OK</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
