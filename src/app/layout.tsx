import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";
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
        <PasswordProvider>
          <SettingsProvider>
              {children}
              <Toaster />
              <AppExitHandler />
          </SettingsProvider>
        </PasswordProvider>
      </body>
    </html>
  );
}
