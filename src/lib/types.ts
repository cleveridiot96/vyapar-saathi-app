export type MasterItemType = "Supplier" | "Customer" | "Agent" | "Warehouse" | "Transporter" | "Expense" | "Product" | "Broker";

export interface MasterItem {
  id: string;
  type: MasterItemType;
  name: string;
  details?: {
    commission?: number;
    commissionType?: 'Percentage' | 'Fixed';
    openingBalance?: number;
    openingBalanceType?: 'Dr' | 'Cr';
  };
  balance?: number;
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
};

export interface AggregatedInventoryItem {
    key: string;
    lotNumber: string;
    originalBags: number;
    currentBags: number;
    currentWeight: number;
    purchaseRate: number;
    effectiveRate: number;
    locationId: string;
    locationName: string;
    supplierName: string;
    purchaseDate: string;
    averageWeightPerBag: number;
    costBreakdown: CostBreakdown;
    cogs: number;
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
  type: 'Sale' | 'Purchase' | 'Payment' | 'Receipt' | 'Lot' | 'Party' | 'Transfer';
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

export interface TransactionalProfitInfo {
  saleId: string;
  date: string;
  billNumber?: string;
  customerName?: string;
  brokerName?: string;
  lotNumber: string;
  saleNetWeightKg: number;
  saleQuantityBags: number;
  basePurchaseRate: number;
  landedCostPerKg: number;
  saleRatePerKg: number;
  goodsValue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  netProfit: number;
  costBreakdown: CostBreakdown;
  saleExpenses: {
    total: number;
    [key: string]: number;
  };
}
