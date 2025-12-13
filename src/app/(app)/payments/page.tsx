
"use client";

import { PaymentsClient } from "@/components/app/payments/PaymentsClient";
import { useTransactions } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsPage() {
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
  
  return <PaymentsClient />;
}
