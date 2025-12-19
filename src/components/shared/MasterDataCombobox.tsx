"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Pencil, Lightbulb, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import Fuse from 'fuse.js';
import { debounce } from '@/lib/utils';
import { Input } from "../ui/input";

export interface Option {
  value: string;
  label: string;
}

interface MasterDataComboboxProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  addNewLabel?: string;
  onAddNew?: (e: React.MouseEvent) => void;
  onEdit?: (id: string, e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export function MasterDataCombobox({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  notFoundMessage = "No option found.",
  addNewLabel = "Add new",
  onAddNew,
  onEdit,
  disabled = false,
  className,
}: MasterDataComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  
  const selectedOption = options.find((opt) => opt.value === value);

  const fuse = React.useMemo(() => new Fuse(options, {
    keys: ['label'],
    threshold: 0.3,
  }), [options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return fuse.search(searchValue).map(result => result.item);
  }, [options, searchValue, fuse]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? undefined : selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setOpen(false);
    setSearchValue("");
  };

  const handleAddNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (onAddNew) onAddNew(e);
  };

  const handleEdit = (e: React.MouseEvent, optionValue: string) => {
      e.stopPropagation();
      setOpen(false);
      if (onEdit) onEdit(optionValue, e);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          type="button"
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
           <div className="flex items-center gap-1">
             {value && !disabled && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
                  className="mr-1 hover:bg-muted rounded-full p-0.5 focus:outline-none"
                  title="Clear selection"
                >
                  <XCircle className="h-4 w-4 opacity-50 hover:opacity-100" />
                </div>
             )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b">
           <Input 
             placeholder={searchPlaceholder}
             value={searchValue}
             onChange={(e) => setSearchValue(e.target.value)}
             autoFocus
             className="h-9"
           />
        </div>
        <ScrollArea className="h-60">
            {filteredOptions.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">{notFoundMessage}</p>
            )}
            {filteredOptions.map((option) => (
                <div 
                    key={option.value} 
                    onClick={() => handleSelect(option.value)}
                    className="flex items-center justify-between p-2 rounded-sm hover:bg-accent cursor-pointer"
                >
                    <div className="flex items-center">
                        <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{option.label}</span>
                    </div>
                    {onEdit && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleEdit(e, option.value)}>
                            <Pencil className="h-3 w-3 text-muted-foreground"/>
                        </Button>
                    )}
                </div>
            ))}
        </ScrollArea>
        {onAddNew && (
            <div className="p-2 border-t">
                <Button variant="ghost" className="w-full justify-start" onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4"/>
                    {addNewLabel}
                </Button>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
