"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X, Edit2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  options = [],
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  notFoundMessage = "No item found.",
  addNewLabel = "Add New",
  onAddNew,
  onEdit,
  disabled = false,
  className,
}: MasterDataComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? undefined : optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="mr-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3 opacity-50 hover:opacity-100" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {/* Clear Selection */}
            {value && (
              <button
                type="button"
                className="w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-muted-foreground border-b justify-center m-1"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onChange(undefined);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <X className="mr-2 h-4 w-4" /> Clear Selection
              </button>
            )}

            {/* No Results */}
            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {notFoundMessage}
              </div>
            )}

            {/* Options */}
            <div className="p-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground group text-left"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSelect(option.value);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{option.label}</span>
                  {onEdit && (
                    <span
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(false);
                        onEdit(option.value, e as any);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded flex-shrink-0"
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Add New */}
            {onAddNew && (
              <>
                <div className="h-px bg-border my-1" />
                <button
                  type="button"
                  className="w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium m-1 text-left"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    onAddNew(e);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {addNewLabel}
                </button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
