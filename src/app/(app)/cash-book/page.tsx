import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CashBookPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Book</CardTitle>
        <CardDescription>Tracks daily cash flow and transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
