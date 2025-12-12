import type { Purchase } from '@/lib/types';
interface AddPurchaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (purchase: Purchase) => void;
    purchaseToEdit: Purchase | null;
}
export function AddPurchaseForm({ isOpen, onClose, onSubmit, purchaseToEdit }: AddPurchaseFormProps) {
    if (!isOpen) return null;
    return <div>Add Purchase Form Placeholder</div>;
}
