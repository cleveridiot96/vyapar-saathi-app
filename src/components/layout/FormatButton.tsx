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
import { useAppState } from '@/hooks/useAppState';
import { format } from 'date-fns';

export function FormatButton() {
  const { printSettings, setPrintSettings } = useSettings();
  const { toast } = useToast();
  const [isFormatting, setIsFormatting] = useState(false);
  const appState = useAppState();

  const handleToggle = (key: keyof typeof printSettings) => {
    setPrintSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEmergencyFormat = () => {
    setIsFormatting(true);
    
    try {
      // 1. Create backup data from events
      const dataToBackup = {
        events: appState.events,
      };

      const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = format(new Date(), 'yyyy-MM-dd_HH-mm');
      link.download = `vyapar-saathi-backup-${date}.json`;
      
      // 2. Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Created",
        description: "Your data backup has been downloaded. The app will now be formatted.",
      });

      // 3. Proceed with format after a short delay
      setTimeout(() => {
        // Clear IndexedDB by deleting the database
        const deleteRequest = indexedDB.deleteDatabase('InventoryDB');
        
        deleteRequest.onsuccess = () => {
            console.log("Database deleted successfully");

            toast({
              title: "Format Complete",
              description: "All application data has been wiped. The app will now reload.",
              duration: 4000,
            });

            setTimeout(() => {
              window.location.reload();
            }, 4000);
        };
        
        deleteRequest.onerror = (event) => {
          console.error("Error deleting database:", event);
           toast({
            title: "Format Error",
            description: "Could not delete database. Please clear site data manually.",
            variant: "destructive",
          });
          setIsFormatting(false);
        };

        deleteRequest.onblocked = () => {
            console.warn("Database deletion is blocked. Please close other tabs of this app.");
            toast({
                title: "Action Blocked",
                description: "Please close any other open tabs of this application and try again.",
                variant: "destructive",
            });
            setIsFormatting(false);
        };

      }, 1000);

    } catch (error) {
      console.error("Failed to backup or wipe data:", error);
      toast({
        title: "Error",
        description: "Could not complete the backup and format process.",
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
                  This will first download a backup of all your current data, and then it will permanently delete ALL data from this application. This action is irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsFormatting(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmergencyFormat} disabled={isFormatting}>
                  {isFormatting ? "PROCESSING..." : "Backup and Format"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </>
  );
}
