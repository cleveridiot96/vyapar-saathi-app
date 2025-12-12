import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SalesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales</CardTitle>
        <CardDescription>Enables creation and management of sales transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
