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
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

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

  const handleSelect = React.useCallback((currentValue: string) => {
    onChange(currentValue === value ? undefined : currentValue);
    setOpen(false);
    setSearchValue("");
  }, [onChange, value]);
  
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(option => 
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <ScrollArea className="h-64">
              {filteredOptions.length === 0 && !onAddNew && (
                <CommandEmpty>
                  <div className="py-2 text-center text-sm">
                    {notFoundMessage}
                  </div>
                </CommandEmpty>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
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
                        onClick={(e) => {
                           if(onEdit) {
                               setOpen(false);
                               onEdit(option.value, e);
                           }
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
            {onAddNew && (
              <CommandItem
                onSelect={(e) => {
                  if (onAddNew) {
                    setOpen(false);
                    onAddNew(e as any);
                  }
                }}
                className="cursor-pointer mt-1 border-t"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addNewLabel}
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
