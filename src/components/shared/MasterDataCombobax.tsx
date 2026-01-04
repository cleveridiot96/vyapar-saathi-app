"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Pencil, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import Fuse from 'fuse.js';
import { debounce } from '@/lib/utils';
import { Input } from "../ui/input";

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
  
  const selectedOption = React.useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  const fuse = React.useMemo(() => new Fuse(options, {
    keys: ['label'],
    threshold: 0.3,
  }), [options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return fuse.search(searchValue).map(result => result.item);
  }, [options, searchValue, fuse]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? undefined : selectedValue);
    setOpen(false);
  }

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
      <DialogContent className="p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{placeholder}</DialogTitle>
          <Input 
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            autoFocus
          />
        </DialogHeader>
        <ScrollArea className="max-h-64">
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground p-4">{notFoundMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <div key={option.value} onClick={() => handleSelect(option.value)} className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{option.label}</span>
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(option.value, e); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {onAddNew && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full justify-start text-primary" onClick={onAddNew}>
              <Plus className="mr-2 h-4 w-4"/>
              {addNewLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
