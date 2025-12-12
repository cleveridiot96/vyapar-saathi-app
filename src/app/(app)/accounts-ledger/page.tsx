import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AccountsLedgerPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts Ledger</CardTitle>
        <CardDescription>Displays a full financial ledger per party.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
