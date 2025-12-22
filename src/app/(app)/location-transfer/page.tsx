"use client";

import { LocationTransferClient } from "@/components/app/location-transfer/LocationTransferClient";
import { useTransactions } from "@/hooks/useTransactions";
import { useHydrated } from "@/hooks/useHydrated";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationTransferPage() {
  // Using useTransactions directly ensures we are checking the actual data source loading state
  const { isLoaded } = useTransactions();
  const hydrated = useHydrated();

  if (!isLoaded || !hydrated) {
    return (
       <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  return <LocationTransferClient />;
}
