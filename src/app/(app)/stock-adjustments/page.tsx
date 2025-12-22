
"use client";

import { StockAdjustmentsClient } from "@/components/app/stock-adjustments/StockAdjustmentsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/useAppState";
import { useHydrated } from "@/hooks/useHydrated";

export default function StockAdjustmentsPage() {
    const { isLoaded } = useAppState();
    const hydrated = useHydrated();

    if (!isLoaded || !hydrated) {
        return (
            <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-[calc(100vh-15rem)] w-full" />
            </div>
        )
    }

    return <StockAdjustmentsClient />;
}
