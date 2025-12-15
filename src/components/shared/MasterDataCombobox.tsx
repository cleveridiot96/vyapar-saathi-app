"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
  tooltipContent?: React.ReactNode;
}

interface MasterDataComboboxProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
  onEdit?: (id: string) => void;
  disabled?: boolean;
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
}: MasterDataComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>
            {notFoundMessage}
            {onAddNew && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start mt-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {addNewLabel}
              </Button>
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value === value ? undefined : option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate">{option.label}</span>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpen(false);
                      onEdit(option.value);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          {onAddNew && options.length > 0 && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {addNewLabel}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}