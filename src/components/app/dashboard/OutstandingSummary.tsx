
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useSettings } from "@/contexts/SettingsContext";
import type { MasterItem } from '@/lib/types';


interface OutstandingSummaryProps {
    receivableParties: (MasterItem & { balance?: number })[];
    payableParties: (MasterItem & { balance?: number })[];
}

export const OutstandingSummary: React.FC<OutstandingSummaryProps> = ({ receivableParties, payableParties }) => {
  const { financialYear } = useSettings();

  const { totalReceivable, totalPayable } = useMemo(() => {
    if (!receivableParties || !payableParties) return { totalReceivable: 0, totalPayable: 0 };
    
    const totalReceivable = receivableParties.reduce((sum, p) => sum + (p.balance || 0), 0);
    const totalPayable = payableParties.reduce((sum, p) => sum + Math.abs(p.balance || 0), 0);
    
    return { totalReceivable, totalPayable };

  }, [receivableParties, payableParties]);
  
  return (
    <Card className="col-span-1 lg:col-span-1 text-white" style={{background: 'linear-gradient(to top right, #34d399, #2563eb)'}}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">OUTSTANDING BALANCES (FY {financialYear})</CardTitle>
        <CardDescription className="text-white/80">A SUMMARY OF TOTAL MONEY TO BE PAID AND RECEIVED. CLICK A CARD TO SEE DETAILS.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/outstanding" className="block group">
              <Card className="h-full transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 bg-white/10 backdrop-blur-sm text-white border-white/20">
                  <CardHeader>
                      <CardTitle className="font-semibold">TOTAL RECEIVABLES</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-3xl font-bold">₹{totalReceivable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </CardContent>
              </Card>
            </Link>
             <Link href="/outstanding" className="block group">
               <Card className="h-full transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 bg-white/10 backdrop-blur-sm text-white border-white/20">
                  <CardHeader>
                      <CardTitle className="font-semibold">TOTAL PAYABLES</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-3xl font-bold">₹{Math.abs(totalPayable).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </CardContent>
              </Card>
            </Link>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white">
            <Link href="/outstanding">VIEW FULL OUTSTANDING REPORT</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
