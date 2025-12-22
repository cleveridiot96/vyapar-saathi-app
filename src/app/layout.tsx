import type {Metadata} from 'next';
import { Poppins, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppExitHandler from '@/components/layout/AppExitHandler';

export const metadata: Metadata = {
  title: 'Vyapar Saathi',
  description: 'Your modern business companion',
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", poppins.variable, sourceCodePro.variable)} suppressHydrationWarning>
          <SettingsProvider>
              {children}
              <Toaster />
              <AppExitHandler />
          </SettingsProvider>
      </body>
    </html>
  );
}
