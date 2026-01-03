
"use client";

import React, { useRef, type ChangeEvent, useEffect, useCallback, useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useToast } from "@/hooks/use-toast";
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { navItems, type StyledNavItem as Feature } from '@/lib/features';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Edit, Save } from 'lucide-react';
import { useHydrated } from '@/hooks/useHydrated';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableDashboardTile } from '@/components/app/dashboard/SortableDashboardTile';
import { DashboardTile } from '@/components/DashboardTile';
import { WarehouseSummary } from '@/components/app/dashboard/WarehouseSummary';
import { OutstandingSummary } from '@/components/app/dashboard/OutstandingSummary';
import { ProfitAnalysisClient } from '../profit-analysis/ProfitAnalysisClient';
import { useMasters, useTransactions } from '@/hooks/useTransactions';

// A "plain" version of the feature without the icon component
type PlainFeature = Omit<Feature, 'icon'>;

export function DashboardClient() {
    const { financialYear } = useSettings();
    const isHydrated = useHydrated();
    
    const [orderedNavItems, setOrderedNavItems] = useState<PlainFeature[]>(
        navItems.filter(f => f.href !== '/dashboard').map(({ ...rest }) => rest)
    );

    const [isEditMode, setIsEditMode] = useState(false);
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOrderedNavItems((items) => {
                const oldIndex = items.findIndex((item) => item.title === active.id);
                const newIndex = items.findIndex((item) => item.title === over.id);
                if (oldIndex === -1 || newIndex === -1) return items;
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    
    return (
        <div className="flex flex-col gap-6 relative h-full">
            <PrintHeaderSymbol className="text-center text-lg font-semibold text-foreground mb-2" />
            <div className="mx-auto w-full max-w-7xl">
                <div className="text-left flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground uppercase">Dashboard (FY {financialYear})</h1>
                    <Button onClick={() => setIsEditMode(prev => !prev)} variant={isEditMode ? 'default' : 'outline'}>
                        {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                        {isEditMode ? "Save Layout" : "Edit Layout"}
                    </Button>
                </div>

                {!isHydrated || orderedNavItems.length === 0 ? ( 
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: navItems.length -1 }).map((_, index) => (
                            <Skeleton key={index} className="h-40 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        disabled={!isEditMode}
                    >
                        <SortableContext
                            items={orderedNavItems.map(item => item.title)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                                {orderedNavItems.map((plainFeature) => {
                                    const feature = navItems.find(f => f.title === plainFeature.title);
                                    if (!feature) return null;
                                    return (
                                    <SortableDashboardTile key={plainFeature.title} id={plainFeature.title} isEditMode={isEditMode}>
                                        <DashboardTile 
                                            title={feature.title} 
                                            iconName={feature.iconName} 
                                            href={feature.href} 
                                            style={{
                                                '--shadow-color': feature.shadow,
                                                backgroundImage: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
                                                color: feature.textColor,
                                            } as React.CSSProperties}
                                        />
                                    </SortableDashboardTile>
                                    )
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
            
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mx-auto w-full max-w-7xl">
                <WarehouseSummary />
                <OutstandingSummary />
                <div className="lg:col-span-2">
                    <ProfitAnalysisClient />
                </div>
            </div>

        </div>
    );
}
