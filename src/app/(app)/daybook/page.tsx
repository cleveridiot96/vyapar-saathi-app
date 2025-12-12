import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DaybookPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daybook</CardTitle>
        <CardDescription>Displays all daily entries and transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
