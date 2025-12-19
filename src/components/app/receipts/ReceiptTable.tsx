"use client";

import * as React from "react";
import type { Receipt } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTableColumnHeader";
import { Badge } from "@/components/ui/badge";

interface ReceiptTableProps {
  data: Receipt[];
  onEdit: (receipt: Receipt) => void;
  onDelete: (receiptId: string) => void;
}

export const ReceiptTable: React.FC<ReceiptTableProps> = ({ data, onEdit, onDelete }) => {
  const columns = React.useMemo<ColumnDef<Receipt>[]>(() => [
    {
      accessorKey: 'date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => format(parseISO(row.original.date), "dd/MM/yy"),
    },
    {
      accessorKey: 'partyName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Party" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="font-medium">{row.original.partyName}</span>
            <Badge variant="outline" className="w-fit">{row.original.partyType}</Badge>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount (₹)" className="justify-end" />,
      cell: ({ row }) => <div className="text-right font-semibold">{row.original.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>,
    },
    {
        accessorKey: 'cashDiscount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Discount (₹)" className="justify-end" />,
        cell: ({ row }) => <div className="text-right">{row.original.cashDiscount?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || '-'}</div>,
    },
    {
      accessorKey: 'paymentMethod',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
    },
    {
      accessorKey: 'transactionType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
       cell: ({ row }) => <div className="truncate max-w-[150px]">{row.original.notes || '-'}</div>
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" /><span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(row.original.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ], [onEdit, onDelete]);

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No receipts recorded yet.</p>;
  }

  return <DataTable columns={columns} data={data} getRowId={(row) => row.id} />;
};
