"use client";

import { LocationTransferClient } from "@/components/app/location-transfer/LocationTransferClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from 'react';

export default function LocationTransferPage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate a minimal delay
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return <LocationTransferClient />;
}
