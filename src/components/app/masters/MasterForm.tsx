"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { MasterItem, MasterItemType, Agent } from "@/lib/types";

interface MasterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: MasterItem) => void;
  itemType: MasterItemType;
  initialData?: MasterItem | null;
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  commission: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MasterForm({
  isOpen,
  onClose,
  onSubmit,
  itemType,
  initialData,
}: MasterFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      commission: (initialData as Agent)?.commission || undefined,
    },
  });
  
  React.useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      commission: (initialData as Agent)?.commission || undefined,
    });
  }, [initialData, form]);

  const handleSubmit = (values: FormValues) => {
    const itemData: MasterItem = {
      id: initialData?.id || `${itemType.toLowerCase()}-${Date.now()}`,
      type: itemType,
      name: values.name,
      details: itemType === 'Agent' ? { commission: values.commission } : {},
    };
    onSubmit(itemData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Add"} {itemType}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the {itemType.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{itemType} Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${itemType.toLowerCase()} name`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {itemType === 'Agent' && (
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter commission rate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
