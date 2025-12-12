"use client";
import React from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
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
import { Trash2 } from 'lucide-react';


export function FormatButton() {
    const { toast } = useToast();

    const handleFormat = () => {
        try {
            localStorage.clear();
            toast({
                title: "Application Data Cleared",
                description: "All local data has been wiped. Please refresh the page.",
                variant: 'destructive'
            });
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not clear local data. Please clear your browser cache manually.",
                variant: 'destructive'
            })
        }
    };
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    EMERGENCY FORMAT
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all application data from your browser, including all transactions, settings, and master data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFormat}>Yes, delete everything</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
