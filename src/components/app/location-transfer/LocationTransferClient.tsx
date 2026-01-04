
"use client";

import * as React from "react";
import type { LocationTransfer, LedgerEntry, MasterItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRightLeft, ListChecks, Boxes, Printer, Trash2, Edit, Download, MoreVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format as formatDateFn, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/contexts/SettingsContext";
import { isDateInFinancialYear } from "@/lib/utils";
import { PrintHeaderSymbol } from '@/components/shared/PrintHeaderSymbol';
import { cn } from "@/lib/utils";
import { useTransactions, useMasters } from "@/hooks/useTransactions";
import { useInventory } from '@/hooks/useInventory';
import { DatePickerWithRange } from "@/components/shared/DatePickerWithRange";
import type { DateRange } from "react-day-picker";
import { renderToStaticMarkup } from 'react-dom/server';
import dynamic from 'next/dynamic';

const AddLocationTransferForm = dynamic(() => import('./AddLocationTransferForm').then(mod => mod.AddLocationTransferForm), { ssr: false });
const LocationTransferSlipPrint = dynamic(() => import('./LocationTransferSlipPrint').then(mod => mod.LocationTransferSlipPrint), { ssr: false });

const KEY_SEPARATOR = '_$_';

interface ExpandedTransferHistoryItem extends LocationTransfer {
  item: LocationTransfer['items'][0];
}

function openPrintWindow(htmlContent: string, title = "Document") {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("Please allow pop-ups to print this document.");
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page {
              size: A5 portrait;
              margin: 10mm;
            }
            body {
              background:  white ! important;
              color: black !important;
              font-size: 10pt !important;
            }
            .print-chitti-styles { font-family: sans-serif; line-height: 1.4; }
            .print-chitti-styles h1, .print-chitti-styles h2, .print-chitti-styles h3 { margin-top: 0. 5em; margin-bottom: 0.25em; }
            .print-chitti-styles table { width: 100%; border-collapse:  collapse; margin-top: 10px; margin-bottom: 10px; }
            .print-chitti-styles th, .print-chitti-styles td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
            .print-chitti-styles th { background-color: #f0f0f0; -webkit-print-color-adjust:  exact ! important; print-color-adjust: exact !important;}
            .print-chitti-styles . text-right { text-align: right; }
            .print-chitti-styles .font-bold { font-weight: bold; }
            .print-chitti-styles .mt-4 { margin-top: 16px; }
            .print-chitti-styles .mb-2 { margin-bottom: 8px; }
            .print-chitti-styles .flex-between { display: flex; justify-content: space-between; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          setTimeout(function() {
            window.print();
            window.close();
          }, 250);
        </script>
      </body>
    </html>
  `);
  printWindow. document.close();
}


export function LocationTransferClient() {
  const { toast } = useToast();
  const { financialYear, isAppHydrating } = useSettings();
  const { 
    locationTransfers,
    addLocationTransfer,
  } = useTransactions();
  const { masterData, addOrUpdateMaster, getAllMasters } = useMasters();
  
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [transferToEdit, setTransferToEdit] = React.useState<LocationTransfer | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<LocationTransfer | null>(null);

  const [activeTab, setActiveTab] = React. useState('stockOverview');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  
  const { availableStock, isLoading: isInventoryLoading } = useInventory(transferToEdit?.id);


  React.useEffect(() => {
    if (! dateRange) {
        const today = new Date();
        setDateRange({ from: startOfDay(subDays(today, 30)), to: endOfDay(today) });
    }
  }, [dateRange]);

  const handleAddOrUpdateTransfer = React.useCallback((transfer: LocationTransfer) => {
    // This logic needs to be updated if editing is implemented
    addLocationTransfer(transfer);
    toast({ title: transferToEdit ? "Transfer Updated" : "Transfer Created", description: transferToEdit ? "Location transfer details saved." : "New location transfer recorded successfully." });
    setTransferToEdit(null);
    window.dispatchEvent(new CustomEvent('reindex-search'));
  }, [addLocationTransfer, toast, transferToEdit]);


  const handleEditTransfer = React.useCallback((transfer: LocationTransfer) => { setTransferToEdit(transfer); setIsAddFormOpen(true); }, []);
  const handleDeleteTransferAttempt = React.useCallback((transfer: LocationTransfer) => { setItemToDelete(transfer); }, []);

  const confirmDeleteTransfer = React.useCallback(() => {
    if (itemToDelete) {
      toast({ title:  "Deletion not implemented", description: "This is a prototype.", variant: "destructive" });
      setItemToDelete(null);
    }
  }, [itemToDelete, toast]);

  const triggerDownloadTransferPdf = React.useCallback((transfer: LocationTransfer) => {
    const slipHtml = renderToStaticMarkup(<LocationTransferSlipPrint transfer={transfer} />);
    openPrintWindow(slipHtml, `TransferSlip_${transfer.id. slice(-4)}`);
  }, []);

  const expandedTransfers = React.useMemo(() => {
    if (isAppHydrating || !dateRange?. from) return [];
    
    const filtered = locationTransfers.filter(lt => isDateInFinancialYear(lt.date, financialYear) && new Date(lt.date) >= dateRange.from!  && new Date(lt.date) <= (dateRange. to || new Date()));
    
    const flatList:  ExpandedTransferHistoryItem[] = [];
    filtered.forEach(transfer => {
      if (transfer.items && transfer.items.length > 0) {
        transfer.items.forEach(item => {
          flatList.push({ ...transfer, item:  item });
        });
      }
    });

    return flatList. sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [locationTransfers, financialYear, isAppHydrating, dateRange]);
  
  const transferHistoryTotals = React.useMemo(() => {
    if (! expandedTransfers || expandedTransfers.length === 0) {
        return { totalBags: 0, totalWeight: 0, totalValue: 0, weightedAverageLandedCost: 0 };
    }
    let totalBags = 0, totalWeight = 0, totalValue = 0;
    expandedTransfers.forEach(transfer => {
        totalBags += transfer.item.quantity;
        totalWeight += transfer.item.netWeight;
        const totalWeightForCalc = transfer.items.reduce((sum, i) => sum + i.netWeight, 0);
        const perKgExpense = (transfer.totalTransferCost && totalWeightForCalc > 0) ? transfer.totalTransferCost / totalWeightForCalc : 0;
        const sourceStock = availableStock.find(s => s.lotNumber === transfer.item.originalLotNumber);
        const originalLandedCost = sourceStock?.effectiveRate || 0;
        const finalLandedCost = originalLandedCost + perKgExpense;
        totalValue += finalLandedCost * transfer.item.netWeight;
    });
    const weightedAverageLandedCost = totalWeight > 0 ? totalValue / totalWeight :  0;
    return { totalBags, totalWeight, totalValue, weightedAverageLandedCost };
  }, [expandedTransfers, availableStock]);
  
  const addButtonDynamicClass = React.useMemo(() => {
    if (activeTab === 'stockOverview') return 'bg-sky-600 hover:bg-sky-700 text-white';
    if (activeTab === 'transferHistory') return 'bg-teal-600 hover:bg-teal-700 text-white';
    return 'bg-primary hover:bg-primary/90';
  }, [activeTab]);

  if (isAppHydrating || isInventoryLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p className="text-lg text-muted-foreground">Loading data...</p></div>;
  }

  return (
    <div className="space-y-8 print-area">
      <PrintHeaderSymbol className="hidden print: block text-center text-lg font-semibold mb-4" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
            <ArrowRightLeft className="mr-3 h-8 w-8 text-primary" /> Location Transfers (FY {financialYear})
        </h1>
        <div className="flex items-center gap-2">
            <Button onClick={() => { setTransferToEdit(null); setIsAddFormOpen(true); }} size="lg" className={cn("text-base py-3 px-6 shadow-md", addButtonDynamicClass)}>
                <PlusCircle className="mr-2 h-5 w-5" /> New Transfer
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}> <Printer className="h-5 w-5" /> <span className="sr-only">Print</span></Button>
        </div>
      </div>

      <Card className="shadow-xl">
      <TooltipProvider>
        <Tabs defaultValue="stockOverview" className="w-full" onValueChange={(value) => setActiveTab(value)}>
          <CardHeader className="p-0">
            <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none no-print p-1 bg-muted gap-1">
              <TabsTrigger value="stockOverview" className="py-3 text-base text-white bg-sky-600 hover:bg-sky-700 data-[state=active]:bg-sky-700 data-[state=active]: text-white data-[state=active]:shadow-lg rounded-md">
                <Boxes className="mr-2 h-5 w-5"/>Stock Overview
              </TabsTrigger>
              <TabsTrigger value="transferHistory" className="py-3 text-base text-white bg-teal-600 hover:bg-teal-700 data-[state=active]: bg-teal-700 data-[state=active]:text-white data-[state=active]: shadow-lg rounded-md">
                <ListChecks className="mr-2 h-5 w-5"/>Transfer History
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <TabsContent value="stockOverview">
            <CardContent className="pt-6">
                <CardDescription className="mb-4 text-sm no-print">Current stock levels for FY {financialYear}. Hover over landed rate for cost breakdown.</CardDescription>
                <ScrollArea className="h-[400px] border rounded-md print:h-auto print:overflow-visible">
                    <Table size="sm"><TableHeader><TableRow>
                        <TableHead>WAREHOUSE</TableHead>
                        <TableHead>VAKKAL/LOT</TableHead>
                        <TableHead className="text-right">BAGS</TableHead>
                        <TableHead className="text-right">WEIGHT (KG)</TableHead>
                        <TableHead className="text-right">LANDED RATE (₹/KG)</TableHead>
                    </TableRow></TableHeader>
                        <TableBody>
                            {availableStock.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No stock for FY {financialYear}.</TableCell></TableRow>}
                            {availableStock. map(item => (
                                <TableRow key={`${item.locationId}${KEY_SEPARATOR}${item.lotNumber}`} className="uppercase">
                                    <TableCell><Tooltip><TooltipTrigger asChild><span className="truncate max-w-[150px] inline-block">{item.locationName || item.locationId}</span></TooltipTrigger><TooltipContent><p>{item.locationName || item.locationId}</p></TooltipContent></Tooltip></TableCell>
                                    <TableCell><Tooltip><TooltipTrigger asChild><span className="truncate max-w-[150px] inline-block">{item. lotNumber}</span></TooltipTrigger><TooltipContent><p>{item.lotNumber}</p></TooltipContent></Tooltip></TableCell>
                                    <TableCell className="text-right font-medium">{Math.round(item.currentBags).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{item.currentWeight ? (item.currentWeight).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : 'N/A'}</TableCell>
                                    <TableCell className="text-right font-semibold text-primary">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-help underline decoration-dashed">
                                                    {Math.round(item.effectiveRate).toLocaleString('en-IN')}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Base:  ₹{item.costBreakdown.baseRate.toFixed(2)}</p>
                                                <p>Purchase Exp: ₹{item.costBreakdown.purchaseExpenses.toFixed(2)}</p>
                                                <p>Transfer Exp: ₹{item.costBreakdown.transferExpenses.toFixed(2)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
          </TabsContent>
          <TabsContent value="transferHistory">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 no-print">
                <DatePickerWithRange date={dateRange} onDateChange={setDateRange} className="max-w-sm w-full"/>
              </div>
              <ScrollArea className="h-[400px] border rounded-md print:h-auto print:overflow-visible">
                <Table size="sm">
                  <TableHeader><TableRow>
                    <TableHead>DATE</TableHead>
                    <TableHead>FROM</TableHead>
                    <TableHead>TO</TableHead>
                    <TableHead>VAKKAL</TableHead>
                    <TableHead className="text-right">BAGS</TableHead>
                    <TableHead className="text-right">WEIGHT</TableHead>
                    <TableHead className="text-right">FINAL LANDED COST (₹/KG)</TableHead>
                    <TableHead className="text-right">TOTAL VALUE (₹)</TableHead>
                    <TableHead className="text-center no-print">ACTIONS</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {expandedTransfers.length === 0 && <TableRow><TableCell colSpan={9} className="text-center h-24">No transfers in the selected period.</TableCell></TableRow>}
                    {expandedTransfers.map(transfer => {
                       const totalWeightForCalc = transfer.items.reduce((sum, i) => sum + i.netWeight, 0);
                       const perKgExpense = (transfer.totalTransferCost && totalWeightForCalc > 0) ? transfer.totalTransferCost / totalWeightForCalc : 0;
                       const sourceStock = availableStock.find(s => s.lotNumber === transfer.item.originalLotNumber);
                       const originalLandedCost = sourceStock?.effectiveRate || 0;
                       const finalLandedCost = originalLandedCost + perKgExpense;
                       const totalValue = finalLandedCost * transfer.item.netWeight;
                       return (
                      <TableRow key={`${transfer.id}${KEY_SEPARATOR}${transfer.item.originalLotNumber}`} className="uppercase">
                        <TableCell>{formatDateFn(parseISO(transfer.date), "dd/MM/yy")}</TableCell>
                        <TableCell><Tooltip><TooltipTrigger asChild><span className="truncate max-w-[150px] inline-block">{transfer.fromLocationName || transfer.fromLocationId}</span></TooltipTrigger><TooltipContent><p>{transfer.fromLocationName || transfer.fromLocationId}</p></TooltipContent></Tooltip></TableCell>
                        <TableCell><Tooltip><TooltipTrigger asChild><span className="truncate max-w-[150px] inline-block">{transfer.toLocationName || transfer.toLocationId}</span></TooltipTrigger><TooltipContent><p>{transfer.toLocationName || transfer.toLocationId}</p></TooltipContent></Tooltip></TableCell>
                        <TableCell>
                          <Tooltip><TooltipTrigger asChild>
                            <span className="truncate max-w-[200px] inline-block">{transfer.item.newLotNumber}</span>
                          </TooltipTrigger>
                            <TooltipContent><p>Original:  {transfer.item.originalLotNumber}</p></TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right">{Math.round(transfer.item.quantity)}</TableCell>
                        <TableCell className="text-right">{transfer.item.netWeight}</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {finalLandedCost > 0 ? `₹${Math.round(finalLandedCost).toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {totalValue > 0 ? `₹${Math.round(totalValue).toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center no-print">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8 px-2"><MoreVertical className="h-4 w-4" /><span className="sr-only">Actions for {transfer.id}</span></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTransfer(transfer)}><Edit className="mr-2 h-4 w-4" /> Edit Full Transfer</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => triggerDownloadTransferPdf(transfer)}><Download className="mr-2 h-4 w-4" /> Download Slip</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteTransferAttempt(transfer)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete Full Transfer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                       );
                    })}
                  </TableBody>
                  <TableFooter>
                      <TableRow className="font-bold bg-muted">
                          <TableCell colSpan={4}>GRAND TOTALS</TableCell>
                          <TableCell className="text-right">{Math.round(transferHistoryTotals.totalBags).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{transferHistoryTotals.totalWeight.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                              {transferHistoryTotals.weightedAverageLandedCost > 0 ? `~ ₹${Math.round(transferHistoryTotals.weightedAverageLandedCost).toLocaleString()}` : ''}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                              {Math.round(transferHistoryTotals.totalValue).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits:  0})}
                          </TableCell>
                          <TableCell></TableCell>
                      </TableRow>
                  </TableFooter>
                </Table>
              </ScrollArea>
            </CardContent>
          </TabsContent>
        </Tabs>
        </TooltipProvider>
      </Card>

      {isAddFormOpen && (
        <AddLocationTransferForm
          key={transferToEdit ?  transferToEdit.id : 'new-transfer'}
          isOpen={isAddFormOpen}
          onClose={() => {
            setIsAddFormOpen(false);
            setTransferToEdit(null);
          }}
          onSubmit={handleAddOrUpdateTransfer}
          transferToEdit={transferToEdit}
          masterData={masterData}
          addOrUpdateMaster={addOrUpdateMaster}
          getAllMasters={getAllMasters}
          availableStock={availableStock}
        />
      )}

      {itemToDelete && (
        <AlertDialog open={!! itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Transfer Record? </AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this record?  This action cannot be undone and will not automatically revert stock changes.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTransfer} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
