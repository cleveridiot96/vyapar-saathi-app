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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onAddNew?: () => void;
  onEdit?: (id: string) => void;
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
      setTimeout(() => onAddNew(), 100);
    }
  }, [onAddNew]);

  const handleEdit = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onEdit) {
        setOpen(false);
        setSearchValue("");
        setTimeout(() => onEdit(id), 100);
    }
  }, [onEdit]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(option => option.label.toLowerCase().includes(searchValue.toLowerCase()));
  }, [options, searchValue]);

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between", className)}
        disabled={disabled}
        type="button"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0" onMouseDown={(e) => e.stopPropagation()}>
            <DialogHeader className="p-4 border-b">
                <DialogTitle>{placeholder}</DialogTitle>
                <DialogDescription>{searchPlaceholder}</DialogDescription>
            </DialogHeader>
            <Command shouldFilter={false} className="p-2">
            <CommandInput 
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
            />
            <CommandList>
                <ScrollArea className="h-64">
                {filteredOptions.length === 0 && (
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
                </ScrollArea>
                {onAddNew && (
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
        </DialogContent>
      </Dialog>
    </>
  );
}
