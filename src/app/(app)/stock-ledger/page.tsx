import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StockLedgerPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Ledger</CardTitle>
        <CardDescription>Provides party-wise stock balances.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
