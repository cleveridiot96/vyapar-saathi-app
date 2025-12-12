import type { Purchase } from '@/lib/types';
interface PurchaseTableProps {
  data: Purchase[];
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (purchase: Purchase) => void;
}
export function PurchaseTable({ data, onEdit, onDelete, onDownloadPdf }: PurchaseTableProps) {
  return <div>Purchase Table Placeholder</div>;
}
