"use client";
import React, { useMemo } from 'react';
import type { Purchase, Sale, PurchaseReturn, SaleReturn, LocationTransfer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterDataCombobox } from "@/components/shared/MasterDataCombobox";
import { format, parseISO } from "date-fns";
import { PackageSearch, ArrowRight, ArrowLeft } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineTitle,
  TimelineIcon,
  TimelineDescription,
  TimelineContent,
} from '@/components/ui/timeline';


export function LotLedgerClient() {
  const { purchases, sales, purchaseReturns, saleReturns, locationTransfers } = useTransactions();
  const [selectedLot, setSelectedLot] = React.useState<string | null>(null);

  const allLotNumbers = useMemo(() => {
    const lots = new Set<string>();
    purchases.forEach(p => p.items.forEach(i => lots.add(i.lotNumber)));
    locationTransfers.forEach(lt => lt.items.forEach(i => {
      lots.add(i.originalLotNumber);
      lots.add(i.newLotNumber);
    }));
    return Array.from(lots).sort().map(lot => ({ value: lot, label: lot }));
  }, [purchases, locationTransfers]);

  const lotHistory = useMemo(() => {
    if (!selectedLot) return [];

    const history: any[] = [];
    
    // Find original purchase
    const purchase = purchases.find(p => p.items.some(i => i.lotNumber === selectedLot));
    if (purchase) {
      const item = purchase.items.find(i => i.lotNumber === selectedLot)!;
      history.push({
        type: 'Purchase',
        date: purchase.date,
        details: `Purchased from ${purchase.supplierName}.`,
        data: { bags: item.quantity, weight: item.netWeight, rate: item.rate }
      });
    }
    
    // Find transfers
    locationTransfers.filter(lt => lt.items.some(i => i.originalLotNumber === selectedLot || i.newLotNumber === selectedLot))
      .forEach(lt => {
        const item = lt.items.find(i => i.originalLotNumber === selectedLot || i.newLotNumber === selectedLot)!;
        history.push({
          type: 'Transfer',
          date: lt.date,
          details: `Transferred from ${lt.fromLocationName} to ${lt.toLocationName}. Renamed to ${item.newLotNumber}`,
          data: { bags: item.quantity, weight: item.netWeight }
        });
    });
    
    // Find sales
    sales.filter(s => s.items.some(i => i.lotNumber === selectedLot))
      .forEach(s => {
        const item = s.items.find(i => i.lotNumber === selectedLot)!;
        history.push({
          type: 'Sale',
          date: s.date,
          details: `Sold to ${s.customerName}.`,
          data: { bags: item.quantity, weight: item.netWeight, rate: item.rate }
        });
    });

    // Find returns
    purchaseReturns.filter(pr => pr.originalLotNumber === selectedLot)
      .forEach(pr => {
        history.push({
          type: 'Purchase Return',
          date: pr.date,
          details: `Returned to supplier ${pr.originalSupplierName}.`,
          data: { bags: pr.quantityReturned, weight: pr.netWeightReturned }
        });
      });
      
    saleReturns.filter(sr => sr.originalLotNumber === selectedLot)
      .forEach(sr => {
        history.push({
          type: 'Sale Return',
          date: sr.date,
          details: `Return from customer ${sr.originalCustomerName}.`,
          data: { bags: sr.quantityReturned, weight: sr.netWeightReturned }
        });
      });

    return history.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [selectedLot, purchases, sales, purchaseReturns, saleReturns, locationTransfers]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <CardTitle className="text-2xl text-foreground flex items-center gap-2">
              <PackageSearch /> Vakkal/Lot Ledger
            </CardTitle>
            <MasterDataCombobox
              value={selectedLot || ""}
              onChange={(value) => setSelectedLot(value)}
              options={allLotNumbers}
              placeholder="SELECT A LOT NUMBER..."
              searchPlaceholder="SEARCH LOTS..."
              className="w-full md:w-72"
            />
        </div>
      </CardHeader>
      <CardContent>
        {selectedLot ? (
            lotHistory.length > 0 ? (
                 <Timeline>
                    {lotHistory.map((event, index) => (
                      <TimelineItem key={index}>
                        <TimelineConnector />
                        <TimelineHeader>
                          <TimelineIcon>
                            {event.type === 'Purchase' || event.type === 'Sale Return' ? <ArrowRight className="text-green-500"/> : <ArrowLeft className="text-red-500"/>}
                          </TimelineIcon>
                          <TimelineTitle>{event.type} - {format(parseISO(event.date), 'dd MMM yyyy')}</TimelineTitle>
                        </TimelineHeader>
                        <TimelineContent>
                          <TimelineDescription>{event.details}</TimelineDescription>
                          <div className="text-xs text-muted-foreground mt-1">
                            Bags: {event.data.bags}, Weight: {event.data.weight} kg
                            {event.data.rate && `, Rate: ₹${event.data.rate}/kg`}
                          </div>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
            ) : (
                <p className="text-muted-foreground text-center py-10">No history found for lot "{selectedLot}".</p>
            )
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <PackageSearch className="mx-auto h-12 w-12" />
            <p className="mt-4">Select a lot number to see its complete lifecycle.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
