import { cn } from "@/lib/utils";

export function PrintHeaderSymbol({ className }: { className?: string }) {
    return <div className={cn("hidden print:block", className)}>Print Header</div>
}
