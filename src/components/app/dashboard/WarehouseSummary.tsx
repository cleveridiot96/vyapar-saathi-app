"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Warehouse, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { AggregatedInventoryItem } from '@/hooks/useInventory';


interface WarehouseSummaryProps {
    inventory: AggregatedInventoryItem[];
}

export const WarehouseSummary: React.FC<WarehouseSummaryProps> = ({ inventory }) => {
    
    const warehouseSummary = React.useMemo(() => {
        if (!inventory) return [];

        const summary = new Map<string, { id: string; name: string; bags: number; netWeight: number }>();

        inventory.forEach(item => {
            if (item.currentBags > 0) {
                const existing = summary.get(item.locationId) || { id: item.locationId, name: item.locationName, bags: 0, netWeight: 0 };
                existing.bags += item.currentBags;
                existing.netWeight += item.currentWeight;
                summary.set(item.locationId, existing);
            }
        });

        return Array.from(summary.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [inventory]);
    
    if(warehouseSummary.length === 0) {
        return (
             <Card className="col-span-1 text-white" style={{background: 'linear-gradient(to top right, #f97316, #facc15)'}}>
                <CardHeader>
                    <CardTitle className="text-xl">Warehouse Stock</CardTitle>
                    <CardDescription className="text-white/80">Current bag totals by location.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p>No stock in any warehouse.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 text-white" style={{background: 'linear-gradient(to top right, #f97316, #facc15)'}}>
            <CardHeader>
                <CardTitle className="text-xl">Warehouse Stock</CardTitle>
                <CardDescription className="text-white/80">Current bag totals by location.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
                {warehouseSummary.map(wh => (
                    <Link key={wh.id} href={`/inventory?warehouseId=${wh.id}`} className="block group">
                        <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <Warehouse className="h-6 w-6" />
                                <div>
                                    <p className="font-semibold">{wh.name}</p>
                                    <p className="text-sm text-white/80">{Math.round(wh.netWeight).toLocaleString()} kg</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <p className="font-bold text-lg">{Math.round(wh.bags).toLocaleString()}</p>
                               <span className="text-xs text-white/80">BAGS</span>
                               <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
};
