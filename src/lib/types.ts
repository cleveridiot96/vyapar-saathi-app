
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
    };
}
