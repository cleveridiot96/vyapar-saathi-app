import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

export default function BackupRestorePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>Allows backing up and restoring app data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">Secure your data by creating backups or restore from a previous point.</p>
        <div className="flex gap-4">
            <Button><Download/>Backup Data</Button>
            <Button variant="outline"><Upload />Restore Data</Button>
        </div>
      </CardContent>
    </Card>
  );
}
