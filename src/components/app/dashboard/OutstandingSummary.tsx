"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useSettings } from "@/contexts/SettingsContext";
import { useOutstandingBalances } from '@/hooks/useOutstandingBalances';
import { Skeleton } from '@/components/ui/skeleton';


export const OutstandingSummary = () => {
  const { financialYear: currentFinancialYearString, isAppHydrating } = useSettings();
  const { receivableParties, payableParties, isBalancesLoading } = useOutstandingBalances();

  const { totalReceivable, totalPayable } = useMemo(() => {
    if (isBalancesLoading || isAppHydrating) return { totalReceivable: 0, totalPayable: 0 };
    
    const totalReceivable = receivableParties.reduce((sum, p) => sum + (p.balance || 0), 0);
    const totalPayable = payableParties.reduce((sum, p) => sum + Math.abs(p.balance || 0), 0);
    
    return { totalReceivable, totalPayable };

  }, [isAppHydrating, isBalancesLoading, receivableParties, payableParties]);
  
  if(isAppHydrating || isBalancesLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-1" style={{background: 'linear-gradient(to top, #1d976c, #93f9b9)', color: 'black'}}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">OUTSTANDING BALANCES (FY {currentFinancialYearString})</CardTitle>
        <CardDescription className="text-black/70">A SUMMARY OF TOTAL MONEY TO BE PAID AND RECEIVED. CLICK A CARD TO SEE DETAILS.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/outstanding" className="block group">
              <Card className="h-full transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 bg-card text-card-foreground">
                  <CardHeader>
                      <CardTitle className="text-green-700">TOTAL RECEIVABLES</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-3xl font-bold text-green-600">₹{totalReceivable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </CardContent>
              </Card>
            </Link>
             <Link href="/outstanding" className="block group">
               <Card className="h-full transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 bg-card text-card-foreground">
                  <CardHeader>
                      <CardTitle className="text-red-700">TOTAL PAYABLES</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-3xl font-bold text-red-600">₹{Math.abs(totalPayable).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </CardContent>
              </Card>
            </Link>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full bg-black/5 hover:bg-black/10 border-black/20 text-black">
            <Link href="/outstanding">VIEW FULL OUTSTANDING REPORT</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
