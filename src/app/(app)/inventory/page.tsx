import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function InventoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <CardDescription>Provides a view of current stock levels and inventory management features.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This feature is under development. Check back soon!</p>
      </CardContent>
    </Card>
  );
}
