import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MastersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Masters</CardTitle>
        <CardDescription>Manages all parties (customers, suppliers, etc.).</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
