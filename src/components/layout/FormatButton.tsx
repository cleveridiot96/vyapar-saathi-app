"use client";

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Printer, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export function FormatButton() {
  const { printSettings, setPrintSettings } = useSettings();
  const { toast } = useToast();
  const [isFormatting, setIsFormatting] = useState(false);

  const handleToggle = (key: keyof typeof printSettings) => {
    setPrintSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEmergencyFormat = () => {
    setIsFormatting(true);
    
    // This is a conceptual wipe for the demo environment. 
    // A real implementation would use the useTransactions hook to clear all state arrays.
    try {
      localStorage.clear(); // Simple wipe for now
      
       toast({
        title: "Format Complete",
        description: "All application data has been wiped. The app will now reload.",
        duration: 4000,
      });

      setTimeout(() => {
        window.location.reload();
      }, 4000);

    } catch (error) {
      console.error("Failed to wipe data:", error);
      toast({
        title: "Error",
        description: "Could not wipe application data.",
        variant: "destructive",
      });
      setIsFormatting(false);
    }
  };

  return (
    <>
      <div className="space-y-3 border-t pt-4">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print Settings
        </Label>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="show-profit" className="text-sm text-muted-foreground">
            Show Profit on Sale Chitti
          </Label>
          <Switch
            id="show-profit"
            checked={printSettings.showProfitOnSaleChitti}
            onCheckedChange={() => handleToggle('showProfitOnSaleChitti')}
          />
        </div>
      </div>
      <div className="space-y-3 border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <ShieldAlert className="mr-2 h-4 w-4" />
                EMERGENCY FORMAT
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ARE YOU ABSOLUTELY SURE?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. It will permanently delete ALL data from this application, including masters, transactions, and settings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsFormatting(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmergencyFormat} disabled={isFormatting}>
                  {isFormatting ? "FORMATTING..." : "Yes, Format Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </>
  );
}
