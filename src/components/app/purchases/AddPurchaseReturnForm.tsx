import type { Purchase, PurchaseReturn } from '@/lib/types';

interface AddPurchaseReturnFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (pr: PurchaseReturn) => void;
    purchases: Purchase[];
    existingPurchaseReturns: PurchaseReturn[];
    purchaseReturnToEdit: PurchaseReturn | null;
}

export function AddPurchaseReturnForm({ isOpen, onClose, onSubmit, purchases, existingPurchaseReturns, purchaseReturnToEdit }: AddPurchaseReturnFormProps) {
    if (!isOpen) return null;
    return <div>Add Purchase Return Form Placeholder</div>;
}
