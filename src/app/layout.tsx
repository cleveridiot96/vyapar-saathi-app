
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppExitHandler from '@/components/layout/AppExitHandler';
import { PasswordProvider } from "@/contexts/PasswordContext";

export const metadata: Metadata = {
  title: "Vyapar Saathi",
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
          <PasswordProvider>
            <AppDataProvider>
                {children}
                <Toaster />
                <AppExitHandler />
            </AppDataProvider>
          </PasswordProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
