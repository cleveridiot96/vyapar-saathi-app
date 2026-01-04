"use client";

import { ReceiptsClient } from "@/components/app/receipts/ReceiptsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function ReceiptsPage() {
    const receipts = useLiveQuery(() => db.receipts.toArray());

    if (receipts === undefined) {
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
    
    return <ReceiptsClient />;
}
