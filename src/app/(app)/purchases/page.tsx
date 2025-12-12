import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PurchasesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchases</CardTitle>
        <CardDescription>Records and manages incoming goods and purchase transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
