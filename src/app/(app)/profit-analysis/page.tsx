import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProfitAnalysisPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit Analysis</CardTitle>
        <CardDescription>Analyzes profitability metrics.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
