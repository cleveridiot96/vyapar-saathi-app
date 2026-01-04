"use client";

import { PaymentsClient } from "@/components/app/payments/PaymentsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function PaymentsPage() {
  const payments = useLiveQuery(() => db.payments.toArray());

  if (payments === undefined) {
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
