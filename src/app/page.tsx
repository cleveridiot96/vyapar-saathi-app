"use client";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { PasswordProvider } from "@/contexts/PasswordContext";

export default function LoginPage() {
  return (
    <PasswordProvider>
        <AuthScreen />
    </PasswordProvider>
  );
}
