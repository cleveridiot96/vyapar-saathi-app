
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/PasswordContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHydrated } from '@/hooks/useHydrated';

export function AuthScreen() {
    const { isAuthenticated, isUnlocked, unlock, hasPassword, setPassword } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const isHydrated = useHydrated();

    const [password, setPasswordInput] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [passwordExists, setPasswordExists] = useState(true); // Default to true to avoid flash of wrong content

    useEffect(() => {
        if (isHydrated) {
            hasPassword().then(exists => {
                setPasswordExists(exists);
                setIsLoading(false);
                if (isAuthenticated) {
                    router.replace('/dashboard');
                }
            });
        }
    }, [isHydrated, isAuthenticated, router, hasPassword]);
    
    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Passwords do not match", variant: 'destructive' });
            return;
        }
        if (password.length < 8) {
            toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: 'destructive' });
            return;
        }
        await setPassword(password);
        toast({ title: "Password set!", description: "You can now log in." });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await unlock(password);
        if (!success) {
            toast({ title: "Invalid password", variant: 'destructive' });
        }
    };

    if (isLoading || (isHydrated && isAuthenticated)) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }
    
    return (
        <main className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                 <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                       <KeyRound className="h-8 w-8"/>
                    </div>
                    <CardTitle className="text-2xl">{passwordExists ? 'Welcome Back!' : 'Set Up Your Secure Password'}</CardTitle>
                    <CardDescription>
                        {passwordExists ? 'Enter your password to unlock your data.' : 'Your data is encrypted locally. This password is the only way to access it.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordExists ? handleLogin : handleSetup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={e => setPasswordInput(e.target.value)} required />
                        </div>
                        {!passwordExists && (
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isUnlocked}>
                            {isUnlocked ? <Loader2 className="animate-spin mr-2" /> : (passwordExists ? 'Unlock' : 'Set Password & Encrypt')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground text-center w-full flex items-center justify-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600"/> All data is encrypted and stored securely on your device.
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}