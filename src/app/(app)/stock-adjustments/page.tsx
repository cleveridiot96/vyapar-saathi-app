
"use client";

import { StockAdjustmentsClient } from "@/components/app/stock-adjustments/StockAdjustmentsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useHydrated } from "@/hooks/useHydrated";

export default function StockAdjustmentsPage() {
    const { isTransactionsLoaded } = useTransactions();
    const hydrated = useHydrated();

    if (!isTransactionsLoaded || !hydrated) {
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
