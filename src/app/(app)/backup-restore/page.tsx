"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertCircle, Save } from "lucide-react";
import { useAppState, useAppDispatch } from '@/hooks/useAppState';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import React from "react";
import { cn } from "@/lib/utils";
import type { TransactionEvent } from "@/lib/eventStore";

export default function BackupRestorePage() {
    const appState = useAppState();
    const appDispatch = useAppDispatch();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const { hasUnsavedChanges, setHasUnsavedChanges, loadEvents } = useAppDispatch();

    const handleSaveData = () => {
        try {
            const dataToSave = {
                events: appState.events,
            };

            const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const date = format(new Date(), 'yyyy-MM-dd_HH-mm');
            link.download = `vyapar-saathi-data-${date}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setHasUnsavedChanges(false);
            toast({
                title: "Data Saved",
                description: "Your data has been successfully downloaded.",
            });
        } catch (error) {
            console.error("Failed to save data:", error);
            toast({
                title: "Error",
                description: "Could not save data. See console for details.",
                variant: "destructive",
            });
        }
    };

    const handleLoadDataClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File is not readable");
                }
                const data = JSON.parse(text);

                if (data && Array.isArray(data.events)) {
                    loadEvents(data.events as TransactionEvent[]);
                    toast({
                        title: "Data Loaded",
                        description: "Your data has been successfully loaded into the application.",
                    });
                } else {
                    throw new Error("Invalid data format in file.");
                }

            } catch (error: any) {
                console.error("Failed to load data:", error);
                toast({
                    title: "Load Error",
                    description: error.message || "Could not load or parse the data file.",
                    variant: "destructive",
                });
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.onerror = () => {
             toast({
                title: "File Read Error",
                description: "Could not read the selected file.",
                variant: "destructive",
            });
        }
        reader.readAsText(file);
    };


    return (
        <Card>
        <CardHeader>
            <CardTitle>Load & Save Data</CardTitle>
            <CardDescription>Manage your application data using local files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                 <h3 className="font-semibold text-blue-800 mb-2">Load Data</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    Start a session by loading a previously saved data file (`.json`). This will replace any data currently in the application.
                </p>
                <Button onClick={handleLoadDataClick} variant="outline"><Upload className="mr-2"/> Load Data From File</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    Save Data 
                    {hasUnsavedChanges && <AlertCircle className="ml-2 h-5 w-5 text-destructive animate-pulse" title="Unsaved changes"/>}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                    Save all your current transactions and master data to a `.json` file on your computer. Make sure to save before closing the app.
                </p>
                <Button onClick={handleSaveData} className={cn(hasUnsavedChanges && "bg-destructive hover:bg-destructive/80")}>
                    {hasUnsavedChanges ? <Save className="mr-2 animate-bounce"/> : <Download className="mr-2"/>}
                    {hasUnsavedChanges ? "Save Unsaved Changes" : "Save Data to File"}
                </Button>
            </div>
        </CardContent>
        </Card>
    );
}
