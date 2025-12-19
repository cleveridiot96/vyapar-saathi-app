"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Pencil, Lightbulb, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import Fuse from 'fuse.js';
import { debounce } from '@/lib/utils';

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
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const fuse = React.useMemo(() => new Fuse(options, {
    keys: ['label', 'value'],
    includeScore: true,
    threshold: 0.4,
  }), [options]);

  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setDebouncedSearchValue(value);
    }, 200),
    []
  );

  React.useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  const handleItemClick = React.useCallback((itemValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(itemValue === value ? undefined : itemValue);
    setOpen(false);
    setSearchValue("");
  }, [onChange, value]);

  const handleClearClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
    setOpen(false);
    setSearchValue("");
  }, [onChange]);

  const handleAddNewClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (onAddNew) {
      onAddNew(e);
    }
  }, [onAddNew]);
  
  const searchResults = React.useMemo(() => {
    if (!debouncedSearchValue) return { exactMatch: null, suggestions: options.map(o => ({ item: o })) };
    const results = fuse.search(debouncedSearchValue);
    const exactMatch = options.find(opt => opt.label.toLowerCase() === debouncedSearchValue.toLowerCase());
    return {
      exactMatch,
      suggestions: results,
    };
  }, [options, debouncedSearchValue, fuse]);

  const bestSuggestion = React.useMemo(() => {
    if (searchResults.exactMatch || searchResults.suggestions.length === 0) {
      return null;
    }
    const best = searchResults.suggestions[0];
    if (best && best.score && best.score < 0.25) {
      return best.item;
    }
    return null;
  }, [searchResults]);

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
      <DialogContent 
        className="p-0" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{placeholder}</DialogTitle>
        <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <ScrollArea className="h-64">
              {searchResults.suggestions.length === 0 && !bestSuggestion ? (
                <div className="py-6 text-center text-sm">{notFoundMessage}</div>
              ) : (
                <div className="overflow-hidden p-1 text-foreground">
                  {value && (
                    <div
                      key="clear-selection"
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-destructive hover:bg-destructive/10 transition-colors mb-1"
                      onMouseDown={handleClearClick}
                      role="option"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Clear Selection
                    </div>
                  )}
                  {bestSuggestion && (
                    <div
                      key={`suggestion-${bestSuggestion.value}`}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none bg-amber-100/80 text-amber-900 hover:bg-amber-100/90 transition-colors mb-1"
                      onMouseDown={(e) => handleItemClick(bestSuggestion.value, e)}
                      role="option"
                      aria-selected={value === bestSuggestion.value}
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Did you mean: <span className="font-semibold ml-1">{bestSuggestion.label}?</span>
                    </div>
                  )}
                  {searchResults.suggestions.map(({ item }) => (
                    <div
                      key={item.value}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted transition-colors"
                      onMouseDown={(e) => handleItemClick(item.value, e)}
                      role="option"
                      aria-selected={value === item.value}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {onEdit && (
                        <button
                          className="h-6 w-6 ml-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpen(false);
                            onEdit(item.value, e);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {onAddNew && (
              <div
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none mt-1 border-t hover:bg-muted transition-colors"
                onMouseDown={handleAddNewClick}
                role="button"
                tabIndex={0}
              >
                <Plus className="mr-2 h-4 w-4" />
                {addNewLabel}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
