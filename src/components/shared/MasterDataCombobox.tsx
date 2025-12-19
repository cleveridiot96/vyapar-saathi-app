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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
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
  onAddNew?: (e?: React.MouseEvent) => void;
  onEdit?: (id: string, e?: React.MouseEvent) => void;
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

  const handleSelect = React.useCallback((currentValue: string) => {
    onChange(currentValue === value ? undefined : currentValue);
    setOpen(false);
    setSearchValue("");
  }, [onChange, value]);
  
  const handleAddNew = React.useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onAddNew) {
      setOpen(false);
      setSearchValue("");
      setTimeout(() => onAddNew(e), 100);
    }
  }, [onAddNew]);

  const handleEdit = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onEdit) {
        setOpen(false);
        setSearchValue("");
        setTimeout(() => onEdit(id, e), 100);
    }
  }, [onEdit]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(option => option.label.toLowerCase().includes(searchValue.toLowerCase()));
  }, [options, searchValue]);

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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && !onAddNew && (
                <CommandEmpty>{notFoundMessage}</CommandEmpty>
            )}
             {(filteredOptions.length === 0 && onAddNew) && (
              <CommandEmpty>
                <div className="py-2 text-center text-sm">
                  {notFoundMessage}
                </div>
                <CommandItem
                  onSelect={handleAddNew}
                  onMouseDown={(e) => e.preventDefault()}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addNewLabel}
                </CommandItem>
              </CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  onMouseDown={(e) => e.preventDefault()}
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
                      type="button"
                      onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(option.value, e);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {onAddNew && filteredOptions.length > 0 && (
              <CommandItem
                onSelect={handleAddNew}
                onMouseDown={(e) => e.preventDefault()}
                className="cursor-pointer mt-1 border-t"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addNewLabel}
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}