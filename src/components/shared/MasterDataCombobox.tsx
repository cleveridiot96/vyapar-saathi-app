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
  const [searchTerm, setSearchTerm] = React.useState("");

  // Find the selected option object to display its label
  const selectedOption = options.find((option) => option.value === value);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Helper to handle clearing
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setOpen(false);
  };

  // Handle option selection
  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue === value ? undefined : optionValue);
    setOpen(false);
    setSearchTerm("");
  };

  // Handle clear from dropdown
  const handleClearFromDropdown = () => {
    onChange(undefined);
    setOpen(false);
    setSearchTerm("");
  };

  // Handle add new
  const handleAddNew = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    setSearchTerm("");
    if (onAddNew) {
      onAddNew(e);
    }
  };

  // Handle edit
  const handleEdit = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    setSearchTerm("");
    if (onEdit) {
      onEdit(optionValue, e);
    }
  };

  // Reset search when opening
  React.useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
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
          
          <div className="flex items-center gap-1">
             {value && !disabled && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="mr-1 hover:bg-muted rounded-full p-0.5"
                  aria-label="Clear selection"
                >
                  <X className="h-3 w-3 opacity-50 hover:opacity-100" />
                </div>
             )}
             <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col" style={{ pointerEvents: 'auto' }}>
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          {/* Options List */}
          <ScrollArea className="max-h-[300px]">
            {/* Clear Selection Option */}
            {value && (
              <button
                type="button"
                className="w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-muted text-muted-foreground text-center font-medium border-b flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearFromDropdown();
                }}
              >
                <X className="mr-2 h-4 w-4" /> Clear Selection
              </button>
            )}

            {/* Filtered Options */}
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {notFoundMessage}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer hover:bg-muted rounded-sm group text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectOption(option.value);
                    }}
                  >
                    <div className="flex items-center flex-1">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{option.label}</span>
                    </div>
                    
                    {onEdit && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(option.value, e);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
                        aria-label="Edit item"
                      >
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Add New Button */}
            {onAddNew && (
              <>
                <div className="border-t my-1" />
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-muted text-primary font-medium flex items-center mx-1 rounded-sm text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddNew(e);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {addNewLabel}
                </button>
              </>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
