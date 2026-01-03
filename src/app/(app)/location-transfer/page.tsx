"use client";

import { LocationTransferClient } from "@/components/app/location-transfer/LocationTransferClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDataContext } from "@/contexts/AppDataContext";

export default function LocationTransferPage() {
  const { state } = useAppDataContext();
  const { isLoaded } = state;

  if (!isLoaded) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[calc(100vh-22rem)] w-full" />
      </div>
    );
  }

  return <LocationTransferClient />;
}
