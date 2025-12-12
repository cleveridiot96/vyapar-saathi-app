import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FinancialSummaryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>Provides a business overview and key financial metrics.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
