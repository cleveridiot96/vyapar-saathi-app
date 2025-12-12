"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { MasterForm } from '@/components/app/masters/MasterForm';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import type { MasterItem } from '@/lib/types';


export default function MastersPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { addOrUpdateMaster } = useTransactions();
  const { toast } = useToast();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
                return;
            }
            setIsFormOpen(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleFormSubmit = (item: MasterItem) => {
      addOrUpdateMaster(item);
      toast({
          title: "Master Item Saved",
          description: `Successfully saved ${item.name} as a ${item.type}.`
      });
      setIsFormOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Masters</CardTitle>
            <CardDescription>Manages all parties (customers, suppliers, etc.).</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Master
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This feature is under development. Please use the "Add New Master" button to create new master items. Viewing and editing will be available soon.</p>
        </CardContent>
      </Card>
      <MasterForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        itemType="Supplier" // Default type, can be changed inside the form
      />
    </>
  );
}
