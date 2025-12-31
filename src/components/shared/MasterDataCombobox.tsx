
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Fuse from 'fuse.js';

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

export const MasterDataCombobox: React.FC<MasterDataComboboxProps> = React.memo(({
  value,
  onChange,
  options = [],
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  notFoundMessage = "No item found.",
  addNewLabel = "Add New",
  onAddNew,
  onEdit,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOption = React.useMemo(() => options.find((option) => option.value === value), [options, value]);

  const fuse = React.useMemo(() => new Fuse(options, {
    keys: ['label'],
    threshold: 0.3,
  }), [options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return fuse.search(searchValue).map(result => result.item);
  }, [options, searchValue, fuse]);

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue === value ? undefined : optionValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleAddNew = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (onAddNew) {
      onAddNew(e);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          type="button"
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-11 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <ScrollArea className="h-auto max-h-60">
          <div className="p-1">
            {filteredOptions.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">{notFoundMessage}</p>
            )}
            {filteredOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                className="w-full justify-start font-normal h-auto py-1.5 px-2"
                onClick={() => handleSelectOption(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
        {onAddNew && (
          <div className="border-t p-1">
            <Button
              variant="ghost"
              className="w-full justify-start font-medium h-auto py-1.5 px-2 text-primary"
              onClick={handleAddNew}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {addNewLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

MasterDataCombobox.displayName = "MasterDataCombobox";

export { MasterDataCombobox };
