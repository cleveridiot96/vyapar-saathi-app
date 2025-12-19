"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
}: MasterDataComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Find the selected option object to display its label
  const selectedOption = options.find((option) => option.value === value);

  // Helper to handle clearing
  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(undefined);
    setOpen(false);
  };

  // Create a mapping of lowercased labels to values for CommandItem onSelect
  const labelToValueMap = React.useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((opt) => {
      map.set(opt.label.toLowerCase(), opt.value);
    });
    return map;
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          
          <div className="flex items-center gap-1">
             {/* Quick Clear Icon on Trigger */}
             {value && !disabled && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="mr-1 hover:bg-muted rounded-full p-0.5 focus:outline-none"
                  title="Clear selection"
                >
                  <X className="h-3 w-3 opacity-50 hover:opacity-100" />
                </div>
             )}
             <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            
            {/* Clear Selection Option inside Dropdown */}
            {value && (
               <CommandGroup>
                  <CommandItem
                    value="__clear_selection__" // distinct value to avoid collisions
                    onSelect={() => handleClear()}
                    className="text-muted-foreground cursor-pointer justify-center text-center font-medium border-b"
                  >
                    <X className="mr-2 h-4 w-4" /> Clear Selection
                  </CommandItem>
               </CommandGroup>
            )}
            
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Use label for search filtering
                  onSelect={(selectedLabel) => {
                    // Convert the label back to value using our map
                    const selectedValue = labelToValueMap.get(selectedLabel.toLowerCase());
                    if (selectedValue) {
                      // Toggle: if clicking the same item, clear it. Otherwise set it.
                      onChange(selectedValue === value ? undefined : selectedValue);
                    }
                    setOpen(false);
                  }}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                  
                  {/* Edit Button (if provided) */}
                  {onEdit && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(false);
                        onEdit(option.value, e);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded cursor-pointer transition-opacity"
                      title="Edit Item"
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {onAddNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={`__add_new_${addNewLabel}__`}
                    className="cursor-pointer font-medium text-primary"
                    onSelect={(e) => {
                      setOpen(false);
                      // Use setTimeout to ensure the popover closes before opening the dialog
                      setTimeout(() => {
                        onAddNew({} as React.MouseEvent);
                      }, 0);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {addNewLabel}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}