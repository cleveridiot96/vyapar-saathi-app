"use client";

import { StockAdjustmentsClient } from "@/components/app/stock-adjustments/StockAdjustmentsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";

export default function StockAdjustmentsPage() {
    const { isMasterDataLoaded, isTransactionsLoaded } = useTransactions();

    if (!isMasterDataLoaded || !isTransactionsLoaded) {
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
