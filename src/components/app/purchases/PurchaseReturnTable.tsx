import type { PurchaseReturn } from '@/lib/types';

interface PurchaseReturnTableProps {
  data: PurchaseReturn[];
  onEdit: (pr: PurchaseReturn) => void;
  onDelete: (id: string) => void;
}

export function PurchaseReturnTable({ data, onEdit, onDelete }: PurchaseReturnTableProps) {
  return <div>Purchase Return Table Placeholder</div>;
}
