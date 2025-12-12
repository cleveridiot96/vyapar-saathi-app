import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReceiptsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <CardDescription>Records receipts received.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
