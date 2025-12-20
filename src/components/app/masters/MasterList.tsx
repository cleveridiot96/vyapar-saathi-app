"use client";

import * as React from 'react';
import type { MasterItem, MasterItemType } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { FuseResult } from 'fuse.js';
import { useSortableTable } from '@/hooks/useSortableTable';
import { DataTableColumnHeader } from '@/components/shared/DataTableColumnHeader';
import { cn } from '@/lib/utils';


const HighlightedText: React.FC<{ text: string; indices: readonly [number, number][] | undefined }> = ({ text, indices }) => {
  if (!indices || indices.length === 0) {
    return <>{text}</>;
  }

  const parts = [];
  let lastIndex = 0;

  indices.forEach(([start, end], i) => {
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }
    parts.push(<mark key={i} className="bg-primary/20 text-primary-foreground rounded-sm px-0.5">{text.substring(start, end + 1)}</mark>);
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

interface MasterListProps {
  data: FuseResult<MasterItem>[];
  itemType: MasterItemType | 'All';
  isAllItemsTab: boolean;
  onEdit: (item: MasterItem) => void;
  onDelete: (item: MasterItem) => void;
  onToggleLock: (item: MasterItem) => void;
  fixedItemIds?: string[];
  searchActive: boolean;
}

export function MasterList({ data, itemType, isAllItemsTab, onEdit, onDelete, onToggleLock, fixedItemIds = [], searchActive }: MasterListProps) {
  const { tableData, handleSort, sortConfig } = useSortableTable(data.map(d => d.item), { key: 'name', direction: 'ascending' });

  const getFuseResult = (item: MasterItem) => data.find(d => d.item.id === item.id);
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {searchActive ? 'No matches found.' : `No ${itemType !== 'All' ? itemType.toLowerCase() : 'items'} found.`}
        </p>
        <p className="text-sm text-muted-foreground">
          {searchActive ? 'Try a different search term.' : 'Click "Add New" to get started.'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-22rem)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
              <DataTableColumnHeader column={{getIsSorted: () => sortConfig.key === 'name' ? sortConfig.direction.slice(0,4) as "asc" | "desc" : false, getCanSort: () => true} as any} title="Name" />
            </TableHead>
            {isAllItemsTab && <TableHead>Type</TableHead>}
            <TableHead>Details</TableHead>
            <TableHead className="text-right w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((item) => {
            const fuseResult = getFuseResult(item);
            const nameMatch = fuseResult?.matches?.find(m => m.key === 'name');
            const isFixed = fixedItemIds.includes(item.id);
            const isLocked = item.locked || isFixed;

            return (
              <TableRow key={item.id} className={cn("hover:bg-muted/50", isLocked && "bg-muted/30")}>
                <TableCell className="font-medium">
                  {isLocked && <Lock className="h-3 w-3 inline-block mr-2 text-muted-foreground" />}
                  <HighlightedText text={item.name} indices={nameMatch?.indices} />
                </TableCell>
                {isAllItemsTab && (
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                )}
                <TableCell className="text-sm text-muted-foreground">
                  {item.details?.commission ? `Commission: ${item.details.commission}${item.details.commissionType === 'Percentage' ? '%' : ' (Fixed)'}` : ''}
                  {item.details?.openingBalance ? ` | OB: ${item.details.openingBalance} ${item.details.openingBalanceType}` : ''}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item)} disabled={isLocked}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                       <DropdownMenuItem 
                        onClick={() => onToggleLock(item)}
                        onSelect={(e) => e.preventDefault()}
                        disabled={isFixed}
                       >
                        {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                        {isLocked ? 'Unlock' : 'Lock'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        disabled={isLocked}
                        className={cn("text-destructive focus:text-destructive focus:bg-destructive/10", isLocked && "cursor-not-allowed")}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
