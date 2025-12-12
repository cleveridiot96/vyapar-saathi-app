"use client";

import React, { useRef, type ChangeEvent, useEffect, useCallback, useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useToast } from "@/hooks/use-toast";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { features, type Feature } from '@/lib/features';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Edit, Save } from 'lucide-react';
import { useHydrated } from '@/hooks/useHydrated';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableDashboardTile } from '@/components/app/dashboard/SortableDashboardTile';
import { FeatureCard } from '@/components/feature-card';
import { WarehouseSummary } from '@/components/app/dashboard/WarehouseSummary';
import { OutstandingSummary } from '@/components/app/dashboard/OutstandingSummary';
import { ProfitAnalysisClient } from '../profit-analysis/ProfitAnalysisClient';

const NAV_ITEMS_ORDER_KEY = 'dashboardNavItemsOrder_v3';

// A "plain" version of the feature without the icon component
type PlainFeature = Omit<Feature, 'icon'>;

export function DashboardClient() {
    const { financialYear } = useSettings();
    const isHydrated = useHydrated();
    
    const [orderedNavItems, setOrderedNavItems] = useLocalStorageState<PlainFeature[]>(
        NAV_ITEMS_ORDER_KEY,
        [] 
    );

    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!isHydrated) return;

        // Map master features to plain objects without the icon component
        const masterNavItems = features.map(({ icon, ...rest }) => rest);
        const itemMap = new Map(masterNavItems.map(item => [item.title, item]));

        const syncedItems: PlainFeature[] = [];
        const existingTitles = new Set<string>();

        (orderedNavItems || []).forEach(item => {
            const configItem = itemMap.get(item.title);
            if (configItem) {
                syncedItems.push(configItem);
                existingTitles.add(item.title);
            }
        });

        masterNavItems.forEach(item => {
            if (!existingTitles.has(item.title)) {
                syncedItems.push(item);
            }
        });

        const currentTitles = orderedNavItems.map(i => i.title).join('|');
        const newTitles = syncedItems.map(i => i.title).join('|');

        if (currentTitles !== newTitles) {
            setOrderedNavItems(syncedItems); 
        }
    }, [isHydrated, setOrderedNavItems, orderedNavItems]);
    
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
            <div className="text-left flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground uppercase">Dashboard (FY {financialYear})</h1>
                <Button onClick={() => setIsEditMode(prev => !prev)} variant={isEditMode ? 'default' : 'outline'}>
                    {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                    {isEditMode ? "Save Layout" : "Edit Layout"}
                </Button>
            </div>

            {!isHydrated || orderedNavItems.length === 0 ? ( 
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: features.length }).map((_, index) => (
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
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {orderedNavItems.map((plainFeature) => (
                                <SortableDashboardTile key={plainFeature.title} id={plainFeature.title} isEditMode={isEditMode}>
                                    <FeatureCard featureTitle={plainFeature.title} />
                                </SortableDashboardTile>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
            
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WarehouseSummary />
                <OutstandingSummary />
                <div className="lg:col-span-2">
                    <ProfitAnalysisClient />
                </div>
            </div>

        </div>
    );
}
