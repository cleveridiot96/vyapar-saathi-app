"use client";

import { PurchasesClient } from "@/components/app/purchases/PurchasesClient";
// FIX: Import from the correct context
import { useAppDataContext } from "@/contexts/AppDataContext"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchasesPage() {
  // FIX: Use the new hook
  const { state } = useAppDataContext();
  const { isLoaded } = state;

  if (!isLoaded) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[calc(100vh-22rem)] w-full" />
      </div>
    );
  }

  return <PurchasesClient />;
}
