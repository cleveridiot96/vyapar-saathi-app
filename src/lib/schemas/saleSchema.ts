import { z } from 'zod';
import type { Sale, AggregatedInventoryItem } from '@/lib/types';

const saleItemSchema = z.object({
  lotNumber: z.string().min(1, "Vakkal/Lot is required."),
  quantity: z.coerce.number({required_error: "Bags are required."}).min(0.01, "Bags must be > 0."),
  netWeight: z.coerce.number({required_error: "Net Wt. is required."}).min(0.01, "Net weight must be > 0."),
  rate: z.coerce.number({required_error: "Rate is required."}).min(0.01, "Rate per KG must be > 0."),
});

export const saleSchema = (
    existingSales: Sale[],
    availableStock: AggregatedInventoryItem[],
    currentSaleIdToEdit?: string
) => z.object({
  date: z.date({ required_error: "Sale date is required." }),
  billNumber: z.string().optional(),
  customerId: z.string().min(1, "Customer is required."),
  brokerId: z.string().optional(),
  transporterId: z.string().optional(),
  
  items: z.array(saleItemSchema).min(1, "At least one sale item is required."),

  expenses: z.array(z.object({
      id: z.string(),
      account: z.string().min(1, "Account name is required."),
      amount: z.coerce.number().min(0.01, "Amount must be positive."),
      paymentMode: z.enum(["Cash", "Bank", "Pending", "Auto-adjusted"]),
      partyId: z.string().optional(),
      partyName: z.string().optional(),
  })).optional(),
  
  notes: z.string().optional(),
  
  cbAmount: z.coerce.number().optional(),
  balanceAmount: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
    const itemQuantities: Record<string, number> = {};

    data.items.forEach(item => {
        if (item.lotNumber) {
            itemQuantities[item.lotNumber] = (itemQuantities[item.lotNumber] || 0) + item.quantity;
        }
    });

    data.items.forEach((item, index) => {
        if (item.lotNumber) {
            const stockItem = availableStock.find(s => s.lotNumber === item.lotNumber);
            const availableBags = stockItem?.currentBags || 0;
            const totalBeingSold = itemQuantities[item.lotNumber];

            if (totalBeingSold > availableBags) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Selling ${totalBeingSold} bags, but only ${availableBags} are in stock.`,
                    path: ["items", index, "quantity"],
                });
            }
        }
    });
});


export type SaleFormValues = z.infer<ReturnType<typeof saleSchema>>;
