"use client";

import { LocationTransferClient } from "@/components/app/location-transfer/LocationTransferClient";
import { useAppState } from "@/hooks/useAppState";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationTransferPage() {
  const { isInitialized, isCalculating } = useAppState();

  // Show loading only on first load
  if (!isInitialized) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Show content immediately, inventory calculates in background
  return <LocationTransferClient />;
}
