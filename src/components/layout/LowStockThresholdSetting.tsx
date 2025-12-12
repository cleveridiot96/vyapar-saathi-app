"use client";

import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

export function LowStockThresholdSetting() {
    const { lowStockThreshold, setLowStockThreshold } = useSettings();

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            setLowStockThreshold(value);
        } else if (e.target.value === '') {
            setLowStockThreshold(0);
        }
    };
    
    return (
        <div className="space-y-3 border-t pt-4">
            <Label htmlFor="low-stock-threshold" className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Low Stock Threshold (Bags)
            </Label>
            <Input
                id="low-stock-threshold"
                type="number"
                value={lowStockThreshold}
                onChange={handleThresholdChange}
                className="h-9"
                min="0"
            />
        </div>
    );
}
