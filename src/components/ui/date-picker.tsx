"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  
  const handleSelect = (selectedDate: Date | undefined) => {
      onDateChange(selectedDate);
      // We don't close here to allow confirmation with OK
  }

  const handleCancel = () => {
    onDateChange(undefined);
    setOpen(false);
  }

  const handleOk = () => {
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
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
          disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
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
