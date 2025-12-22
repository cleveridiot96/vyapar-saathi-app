"use client";

import { LocationTransferClient } from "@/components/app/location-transfer/LocationTransferClient";
import { useAppState } from "@/hooks/useAppState";
import { useHydrated } from "@/hooks/useHydrated";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationTransferPage() {
  const { isLoaded } = useAppState();
  const hydrated = useHydrated();

  if (!isLoaded || !hydrated) {
    return (
       <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[calc(100vh-22rem)] w-full" />
      </div>
    )
  }

  return <LocationTransferClient />;
}
