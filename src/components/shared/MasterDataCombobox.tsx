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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from 'next/dynamic';

const Command = dynamic(() => import('@/components/ui/command').then(mod => mod.Command), { ssr: false });
const CommandInput = dynamic(() => import('@/components/ui/command').then(mod => mod.CommandInput), { ssr: false });
const CommandList = dynamic(() => import('@/components/ui/command').then(mod => mod.CommandList), { ssr: false });
const CommandEmpty = dynamic(() => import('@/components/ui/command').then(mod => mod.CommandEmpty), { ssr: false });
const CommandItem = dynamic(() => import('@/components/ui/command').then(mod => mod.CommandItem), { ssr: false });

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

  // Find the selected option object to display its label
  const selectedOption = React.useMemo(() => options.find((option) => option.value === value), [options, value]);

  // Handle option selection
  const handleSelectOption = React.useCallback((optionValue: string) => {
    onChange(optionValue === value ? undefined : optionValue);
    setOpen(false);
  }, [onChange, value]);

  // Handle add new
  const handleAddNew = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (onAddNew) {
      onAddNew(e);
    }
  }, [onAddNew]);

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
        <Command>
            <CommandInput 
                placeholder={searchPlaceholder}
            />
            <CommandList>
                 <CommandEmpty>{notFoundMessage}</CommandEmpty>
                 {options.map((option) => (
                    <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => handleSelectOption(option.value)}
                    >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {option.label}
                    </CommandItem>
                ))}
                  {onAddNew && (
                    <>
                        <div className="border-t my-1" />
                        <CommandItem onSelect={(e) => handleAddNew(e as any)}>
                            <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                            <span className="text-primary font-medium">{addNewLabel}</span>
                        </CommandItem>
                    </>
                    )}
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

MasterDataCombobox.displayName = "MasterDataCombobox";

