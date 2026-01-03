
export type MasterItemType = "Supplier" | "Customer" | "Agent" | "Warehouse" | "Transporter" | "Expense" | "Product" | "Broker";

export interface MasterItem {
  id: string;
  type: MasterItemType;
  name: string;
  locked?: boolean;
  details?: {
    commission?: number;
    commissionType?: 'Percentage' | 'Fixed';
    openingBalance?: number;
    openingBalanceType?: 'Dr' | 'Cr';
  };
  balance?: number;
}

export interface NavItem {
    title: string;
    href: string;
    iconName: string;
    shortcut?: string;
}

export interface Agent extends MasterItem {
    type: 'Agent';
    details: {
      commission?: number;
    }
}

export interface Broker extends MasterItem {
  type: 'Broker';
  details: {
    commission?: number;
    commissionType?: 'Percentage' | 'Fixed';
  }
}

export interface Customer extends MasterItem {
    type: 'Customer';
}

export interface Transporter extends MasterItem {
    type: 'Transporter';
}

export interface ExpenseItem {
  id: string;
  account: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank' | 'Pending' | 'Auto-adjusted';
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
  invoiceNo?: string;
  partyName?: string;
}

export interface PurchaseReturn {
  type: 'PurchaseReturn';
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

export interface CostBreakdown {
    baseRate: number;
    purchaseExpenses: number;
    transferExpenses: number;
}

export interface SaleItem {
  id: string;
  lotNumber: string;
  quantity: number;
  netWeight: number;
  rate: number;
  goodsValue: number;
  purchaseRate: number;
  costOfGoodsSold: number;
  itemGrossProfit: number;
  itemNetProfit: number;
  costBreakdown?: CostBreakdown;
}

export interface Sale {
  id: string;
  date: string;
  billNumber?: string;
  customerId: string;
  customerName?: string;
  brokerId?: string;
  brokerName?: string;
  transporterId?: string;
  transporterName?: string;
  items: SaleItem[];
  expenses?: ExpenseItem[];
  totalGoodsValue: number;
  billedAmount: number;
  cbAmount?: number;
  balanceAmount?: number;
  totalQuantity: number;
  totalNetWeight: number;
  totalCostOfGoodsSold: number;
  totalGrossProfit: number;
  totalCalculatedProfit: number;
  notes?: string;
  isStockPaymentSale: boolean;
}

export interface SaleReturn {
    type: 'SaleReturn';
    id: string;
    date: string;
    originalSaleId: string;
    originalBillNumber?: string;
    originalCustomerId: string;
    originalCustomerName?: string;
    originalLotNumber: string;
    originalSaleRate: number;
    quantityReturned: number;
    netWeightReturned: number;
    returnAmount: number;
    restockingFee?: number;
    returnReason?: string;
    notes?: string;
}

export interface LocationTransferItem {
    id: string;
    originalLotNumber: string;
    newLotNumber: string;
    quantity: number;
    netWeight: number;
    costOfGoods: number;
}

export interface LocationTransfer {
    id: string;
    date: string;
    fromLocationId: string;
    fromLocationName: string;
    toLocationId: string;
    toLocationName: string;
    items: LocationTransferItem[];
    transporterId?: string;
    totalTransferCost: number;
    notes?: string;
    expenses?: ExpenseItem[];
}

export interface Payment {
  id: string;
  date: string;
  partyId: string;
  partyName: string;
  partyType: MasterItemType;
  amount: number;
  paymentMethod?: 'Cash' | 'Bank' | 'UPI';
  paymentType: 'Cash' | 'Stock';
  transactionType: 'On Account' | 'Against Bill';
  notes?: string;
  source?: string;
  stockItems?: {
    lotNumber: string;
    quantity: number;
    netWeight: number;
    rate: number;
    value: number;
  }[];
  againstBills?: {
    billId: string;
    amount: number;
    billDate?: string;
    billTotal?: number;
    billVakkal?: string;
  }[];
}

export interface Receipt {
  id: string;
  date: string;
  partyId: string;
  partyName: string;
  partyType: MasterItemType;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'UPI';
  transactionType: 'On Account' | 'Against Bill';
  againstBills?: {
      billId: string;
      amount: number;
      billDate?: string;
      billTotal?: number;
      billVakkal?: string;
  }[];
  source?: string;
  notes?: string;
  cashDiscount?: number;
}


export type LedgerEntry = {
  id: string;
  date: string;
  type: 'Expense' | 'Purchase' | 'Sale' | 'Payment' | 'Receipt' | 'Transfer';
  account: string;
  debit: number;
  credit: number;
  paymentMode: 'Cash' | 'Bank' | 'Pending' | 'Auto-adjusted';
  party: string;
  partyId?: string;
  relatedVoucher: string;
  linkedTo?: {
    voucherType: 'Purchase' | 'Sale' | 'Transfer';
    voucherId: string;
  };
  remarks: string;
  voucherType?: 'Purchase' | 'Sale' | 'Transfer' | 'Payment' | 'Receipt';
};

export interface AggregatedInventoryItem {
    key: string;
    lotNumber: string;
    originalBags: number;
    currentBags: number;
    currentWeight: number;
    purchaseRate: number;
    effectiveRate: number;
    cogs: number;
    locationId: string;
    locationName: string;
    supplierName: string;
    purchaseDate: string;
    averageWeightPerBag: number;
    costBreakdown: CostBreakdown;
    daysInStock: number;
    isDeadStock: boolean;
}

export interface StockAdjustment {
  id: string;
  date: string;
  lotNumber: string;
  locationId: string;
  locationName: string;
  bags: number;
  weight: number;
  type: 'Correction' | 'Wastage' | 'Theft' | 'Reversal' | 'Initial Stock';
  reason?: string;
}

export interface SearchableItem {
  id: string;
  type: 'Sale' | 'Purchase' | 'Payment' | 'Receipt' | 'Lot' | 'Party' | 'Transfer' | 'Adjustment' | 'Return';
  title: string;
  description: string;
  date?: string;
  href: string;
}

export interface DaybookEntry {
  id: string;
  date: string;
  type: 'Purchase' | 'Sale' | 'Payment' | 'Receipt' | 'Transfer' | 'Expense';
  voucherNo: string;
  party: string;
  debit: number;
  credit: number;
  narration: string;
  href: string;
  Icon: React.ElementType;
  colorClass: string;
}

export interface Warehouse extends MasterItem {
  type: 'Warehouse';
}

export interface Expense extends MasterItem {
  type: 'Expense';
}

export type TransactionEvent = 
  | { type: 'MASTER_UPSERTED'; payload: MasterItem }
  | { type: 'PURCHASE_CREATED'; payload: Purchase }
  | { type: 'PURCHASE_UPDATED'; payload: Purchase }
  | { type: 'PURCHASE_DELETED'; payload: { id: string } }
  | { type: 'SALE_CREATED'; payload: Sale }
  | { type: 'SALE_UPDATED'; payload: Sale }
  | { type: 'SALE_DELETED'; payload:  { id: string } }
  | { type: 'PAYMENT_CREATED'; payload: Payment }
  | { type: 'PAYMENT_UPDATED'; payload: Payment }
  | { type: 'PAYMENT_DELETED'; payload: { id: string } }
  | { type: 'RECEIPT_CREATED'; payload: Receipt }
  | { type: 'RECEIPT_UPDATED'; payload: Receipt }
  | { type: 'RECEIPT_DELETED'; payload: { id: string } }
  | { type: 'TRANSFER_CREATED'; payload: LocationTransfer }
  | { type: 'ADJUSTMENT_CREATED'; payload: StockAdjustment }
  | { type: 'RETURN_CREATED'; payload: PurchaseReturn | SaleReturn }
  | { type: 'LEDGER_ENTRY_CREATED'; payload: LedgerEntry[] }
  | { type: 'LEDGER_ENTRY_DELETED'; payload: { voucherId: string } };
