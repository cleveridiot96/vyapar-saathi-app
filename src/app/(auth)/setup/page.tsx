
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog } from 'lucide-react';

export default function SetupPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Cog className="mx-auto h-12 w-12 text-primary animate-spin" />
        <CardTitle className="text-3xl mt-4">Setup Required</CardTitle>
        <CardDescription>
          This appears to be your first time running the application. Please follow the setup instructions.
          This feature is under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
            You have been redirected here because the application has not been set up with a PIN yet.
        </p>
      </CardContent>
    </Card>
  );
}
