import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OutstandingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Balances</CardTitle>
        <CardDescription>Manages and displays receivables and payables.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
