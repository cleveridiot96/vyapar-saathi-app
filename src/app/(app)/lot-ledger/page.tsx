import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LotLedgerPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lot Ledger</CardTitle>
        <CardDescription>Traces any vakkal from purchase to sale.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
