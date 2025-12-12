"use client";

import React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { features } from "@/lib/features";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface CommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => unknown) => {
    setOpen(false);
    command();
  };

  const showToast = (title: string) => {
    toast({
        title: "Coming Soon!",
        description: `${title} feature will be implemented soon.`,
    });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          {features.map((feature) => (
            <CommandItem
              key={feature.href}
              value={feature.title}
              onSelect={() => {
                runCommand(() => router.push(feature.href));
              }}
            >
              <feature.icon className="mr-2 h-4 w-4" />
              <span>{feature.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => showToast("New Sale"))}>
                <span>New Sale</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => showToast("New Purchase"))}>
                <span>New Purchase</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => showToast("New Payment"))}>
                <span>New Payment</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => showToast("New Receipt"))}>
                <span>New Receipt</span>
            </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
