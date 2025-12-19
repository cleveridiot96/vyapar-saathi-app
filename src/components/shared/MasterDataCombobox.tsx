"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Pencil, Lightbulb } from "lucide-react";
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
    keys: ['label'],
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

  const labelToValueMap = React.useMemo(() => {
    const map = new Map<string, string>();
    options.forEach(opt => {
      map.set(opt.label.toLowerCase(), opt.value);
    });
    return map;
  }, [options]);

  const handleSelect = React.useCallback((currentValue: string) => {
    const selectedValue = labelToValueMap.get(currentValue.toLowerCase());
    
    if (selectedValue) {
      onChange(selectedValue === value ? undefined : selectedValue);
    }
    setOpen(false);
    setSearchValue("");
  }, [onChange, value, labelToValueMap]);
  
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
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            autoFocus
          />
          <CommandList>
            <ScrollArea className="h-64">
              <CommandEmpty>
                <div className="py-2 text-center text-sm">
                  {notFoundMessage}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {bestSuggestion && (
                  <CommandItem
                    key={`suggestion-${bestSuggestion.value}`}
                    value={bestSuggestion.label}
                    onSelect={handleSelect}
                    className="bg-amber-100/80 text-amber-900 hover:!bg-amber-100/90 focus:!bg-amber-100/90 select-none active:scale-95"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Did you mean: <span className="font-semibold ml-1">{bestSuggestion.label}?</span>
                  </CommandItem>
                )}
                {searchResults.suggestions.map(({ item }) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={handleSelect}
                    className="hover:bg-muted select-none active:scale-95"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           setOpen(false);
                           onEdit(item.value, e);
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
                  setOpen(false);
                  onAddNew(e as any);
                }}
                className="cursor-pointer mt-1 border-t hover:bg-muted select-none active:scale-95"
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
