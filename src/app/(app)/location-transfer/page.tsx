"use client";

import { LocationTransferClient } from "@/components/app/location-transfer/LocationTransferClient";
import { useInventory } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationTransferPage() {
  // Using useInventory hook which now correctly manages its own loading state
  // This ensures the page waits for the async inventory calculation to complete.
  const { isLoading } = useInventory();

  if (isLoading) {
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
