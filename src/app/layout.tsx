import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppExitHandler from '@/components/layout/AppExitHandler';

export const metadata: Metadata = {
  title: "Kisan Khata Sahayak",
  description: "A modern accounting application for agricultural businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={cn("bg-background font-sans antialiased")}>
        <SettingsProvider>
          <AppDataProvider>
              {children}
              <Toaster />
              <AppExitHandler />
          </AppDataProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
