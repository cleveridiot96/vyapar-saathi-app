export type MasterItemType = "Supplier" | "Customer" | "Agent" | "Warehouse" | "Transporter" | "Expense" | "Product";

export interface MasterItem {
  id: string;
  type: MasterItemType;
  name: string;
  details?: Record<string, any>;
}

export interface Agent extends MasterItem {
    type: 'Agent';
    details: {
      commission?: number;
    }
}

export interface ExpenseItem {
  id: string;
  account: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank' | 'Pending';
  partyName?: string;
  partyId?: string;
}

export interface PurchaseItem {
  id: string;
  lotNumber: string;
  category: string;
  quantity: number;
  netWeight: number;
  rate: number;
  goodsValue: number;
  landedCostPerKg: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierName: string;
  supplierId: string;
  agentId?: string;
  agentName?: string;
  transporterId?: string;
  transporterName?: string;
  locationId: string;
  locationName: string;
  items: PurchaseItem[];
  expenses?: ExpenseItem[];
  totalGoodsValue: number;
  totalQuantity: number;
  totalNetWeight: number;
  totalAmount: number;
  effectiveRate: number;
}

export interface PurchaseReturn {
  id: string;
  date: string;
  originalPurchaseId: string;
  originalLotNumber: string;
  originalSupplierId: string;
  originalSupplierName: string;
  originalPurchaseRate: number;
  quantityReturned: number;
  netWeightReturned: number;
  returnAmount: number;
  returnReason?: string;
  notes?: string;
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
  paymentMode: 'Cash' | 'Bank' | 'Pending';
  party: string;
  partyId?: string;
  relatedVoucher: string;
  linkedTo: {
    voucherType: 'Purchase';
    voucherId: string;
  };
  remarks: string;
};
