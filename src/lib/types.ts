export interface Expense {
  id: string;
  account: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank';
  partyName?: string;
  partyId?: string;
}

export interface PurchaseItem {
  id: string;
  lotNumber: string;
  category: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierName: string;
  supplierId: string;
  items: PurchaseItem[];
  expenses?: Expense[];
  totalAmount: number;
}

export interface PurchaseReturn {
  id: string;
  date: string;
  supplierName: string;
  supplierId: string;
  items: PurchaseItem[];
  totalAmount: number;
}

export interface SaleItem {
  lotNumber: string;
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
}

export interface LocationTransferItem {
    originalLotNumber: string;
}

export interface LocationTransfer {
    id: string;
    items: LocationTransferItem[];
}


export type LedgerEntry = {
  id: string;
  date: string;
  type: 'Expense' | 'Purchase';
  account: string;
  debit: number;
  credit: number;
  paymentMode: 'Cash' | 'Bank';
  party: string;
  partyId?: string;
  relatedVoucher: string;
  linkedTo: {
    voucherType: 'Purchase';
    voucherId: string;
  };
  remarks: string;
};
