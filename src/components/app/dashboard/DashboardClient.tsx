"use client";

import React from 'react';
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { navItems } from '@/lib/features';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useHydrated } from '@/hooks/useHydrated';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardTile } from '@/components/DashboardTile';
import { WarehouseSummary } from '@/components/app/dashboard/WarehouseSummary';
import { OutstandingSummary } from '@/components/app/dashboard/OutstandingSummary';
import { ProfitAnalysisClient } from '../profit-analysis/ProfitAnalysisClient';
import { useOutstandingBalances } from '@/hooks/useOutstandingBalances';
import { useInventory } from '@/hooks/useInventory';

export function DashboardClient() {
    const { financialYear } = useSettings();
    const isHydrated = useHydrated();
    
    // --- DATA FETCHING AT THE TOP ---
    const { receivableParties, payableParties, isBalancesLoading } = useOutstandingBalances();
    const { allAggregatedInventory, isLoading: isInventoryLoading } = useInventory();
    
    // Combine loading states
    const isLoading = !isHydrated || isBalancesLoading || isInventoryLoading;

    return (
        <div className="flex flex-col gap-6 relative h-full">
            <PrintHeaderSymbol className="text-center text-lg font-semibold text-foreground mb-2" />
            <div className="mx-auto w-full max-w-7xl">
                <div className="text-left flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground uppercase">Dashboard (FY {financialYear})</h1>
                    <Button variant='outline' disabled>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Layout
                    </Button>
                </div>

                {isLoading ? ( 
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: navItems.length - 1 }).map((_, index) => (
                            <Skeleton key={index} className="h-32 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                        {navItems.filter(f => f.href !== '/dashboard').map((feature) => (
                            <DashboardTile 
                                key={feature.title}
                                title={feature.title} 
                                iconName={feature.iconName} 
                                href={feature.href} 
                                style={{
                                    '--shadow-color': feature.shadow,
                                    backgroundImage: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
                                    color: feature.textColor,
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mx-auto w-full max-w-7xl">
                {isLoading ? (
                    <>
                        <Skeleton className="h-64 rounded-xl" />
                        <Skeleton className="h-64 rounded-xl" />
                    </>
                ) : (
                    <>
                        <WarehouseSummary inventory={allAggregatedInventory || []} />
                        <OutstandingSummary 
                            receivableParties={receivableParties || []} 
                            payableParties={payableParties || []} 
                        />
                    </>
                )}
                
                <div className="lg:col-span-2">
                    <ProfitAnalysisClient />
                </div>
            </div>
        </div>
    );
}
