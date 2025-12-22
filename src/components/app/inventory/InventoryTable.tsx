"use client";
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Archive, RotateCcw, Box } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import type { AggregatedInventoryItem } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';
import { useSortableTable } from '@/hooks/useSortableTable';
import { format, parseISO } from 'date-fns';

interface InventoryTableProps {
  items: AggregatedInventoryItem[];
  onArchive?: (item: AggregatedInventoryItem) => void;
  onUnarchive?: (item: AggregatedInventoryItem) => void;
  isArchivedView?: boolean;
  lowStockThreshold: number;
  rowSelection: Record<string, boolean>;
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const getStatus = (bags: number, threshold: number): { text: string, variant: "default" | "destructive" | "secondary" | "outline" } => {
  if (bags <= 0) return { text: "ZERO STOCK", variant: "destructive" };
  if (bags <= threshold) return { text: "LOW STOCK", variant: "outline" };
  return { text: "IN STOCK", variant: "default" };
}

export function InventoryTable({ items, onArchive, onUnarchive, isArchivedView, lowStockThreshold, rowSelection, setRowSelection }: InventoryTableProps) {
  const { tableData, handleSort, sortConfig } = useSortableTable(items, { key: 'cogs', direction: 'descending' });
  
  const isAllSelected = Object.keys(rowSelection).length === tableData.length && tableData.length > 0;
  const handleSelectAll = () => {
      if (isAllSelected) {
          setRowSelection({});
      } else {
          const newSelection: Record<string, boolean> = {};
          tableData.forEach(item => newSelection[item.key] = true);
          setRowSelection(newSelection);
      }
  };
  const handleRowSelect = (key: string) => {
      setRowSelection(prev => ({...prev, [key]: !prev[key]}));
  };
    
  if (tableData.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No inventory items to display.</p>;
  }

  const SortableHeader: React.FC<{ sortKey: keyof AggregatedInventoryItem, children: React.ReactNode, className?: string }> = ({ sortKey, children, className }) => (
    <TableHead className={cn("cursor-pointer hover:bg-muted/50", className)} onClick={() => handleSort(sortKey)}>
      {children} {sortConfig.key === sortKey ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
    </TableHead>
  );


  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-26rem)] overflow-auto border rounded-md">
        <Table stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead padding="checkbox">
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all rows"/>
              </TableHead>
              <SortableHeader sortKey="locationName">Location</SortableHeader>
              <SortableHeader sortKey="lotNumber">Vakkal/Lot</SortableHeader>
              <SortableHeader sortKey="currentBags" className="text-right">Bags</SortableHeader>
              <SortableHeader sortKey="currentWeight" className="text-right">Weight (kg)</SortableHeader>
              <SortableHeader sortKey="effectiveRate" className="text-right">Landed Rate (₹/kg)</SortableHeader>
              <SortableHeader sortKey="cogs" className="text-right">Total Value (₹)</SortableHeader>
              <TableHead>Status</TableHead>
              <TableHead className="text-center w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map(item => {
              const status = getStatus(item.currentBags, lowStockThreshold);
              return (
              <TableRow key={item.key} data-state={rowSelection[item.key] ? "selected" : undefined}>
                <TableCell padding="checkbox">
                    <Checkbox checked={!!rowSelection[item.key]} onCheckedChange={() => handleRowSelect(item.key)} aria-label={`Select row ${item.lotNumber}`}/>
                </TableCell>
                <TableCell className="font-medium">{item.locationName}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild><span className="font-semibold">{item.lotNumber}</span></TooltipTrigger>
                    <TooltipContent>
                      <p>Supplier: {item.supplierName}</p>
                      <p>Purchased: {format(parseISO(item.purchaseDate), 'dd MMM yyyy')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right">{Math.round(item.currentBags)}</TableCell>
                <TableCell className="text-right">{item.currentWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help underline decoration-dashed">
                        {Math.round(item.effectiveRate).toLocaleString()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Base Rate: ₹{item.costBreakdown.baseRate.toFixed(2)}</p>
                      <p>Purchase Exp: ₹{item.costBreakdown.purchaseExpenses.toFixed(2)}</p>
                      <p>Transfer Exp: ₹{item.costBreakdown.transferExpenses.toFixed(2)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right font-bold text-primary">{Math.round(item.cogs).toLocaleString()}</TableCell>
                <TableCell><Badge variant={status.variant}>{status.text}</Badge></TableCell>
                <TableCell className="text-center">
                  {isArchivedView ? (
                     <Button variant="ghost" size="icon" onClick={() => onUnarchive?.(item)} title="Restore Lot"><RotateCcw className="h-4 w-4 text-green-600" /></Button>
                  ) : (
                     <Button variant="ghost" size="icon" onClick={() => onArchive?.(item)} title="Archive Lot" disabled={item.currentBags > 0.001}><Archive className="h-4 w-4" /></Button>
                  )}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
