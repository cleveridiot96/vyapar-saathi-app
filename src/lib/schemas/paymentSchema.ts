import { z } from 'zod';

export const paymentStockItemSchema = z.object({
  lotNumber: z.string().min(1, "Lot number is required."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  netWeight: z.coerce.number().positive("Net weight must be positive."),
  rate: z.coerce.number().positive("Rate must be positive."),
  value: z.coerce.number(),
});

export const paymentSchema = z.object({
    date: z.date({ required_error: "Date is required."}),
    partyId: z.string().min(1, "Party must be selected."),
    amount: z.coerce.number().optional(),
    paymentMethod: z.enum(['Cash', 'Bank', 'UPI']),
    paymentType: z.enum(['Regular', 'Stock']),
    notes: z.string().optional(),
    stockItems: z.array(paymentStockItemSchema).optional(),
    againstPurchases: z.array(z.object({
        purchaseId: z.string(),
        amount: z.coerce.number().positive(),
    })).optional(),
}).superRefine((data, ctx) => {
    if (data.paymentType === 'Regular' && (!data.amount || data.amount <= 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["amount"],
            message: "Amount is required for a regular payment.",
        });
    }
    if (data.paymentType === 'Stock' && (!data.stockItems || data.stockItems.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stockItems"],
            message: "At least one stock item is required for a stock payment.",
        });
    }
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
