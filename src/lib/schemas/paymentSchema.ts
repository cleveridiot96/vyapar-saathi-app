import { z } from 'zod';

export const paymentStockItemSchema = z.object({
  lotNumber: z.string().min(1, "Lot number is required."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  netWeight: z.coerce.number().positive("Net weight must be positive."),
  rate: z.coerce.number().positive("Rate must be positive."),
  value: z.coerce.number(),
});

const billAllocationSchema = z.object({
  billId: z.string(),
  amount: z.coerce.number().positive("Allocation amount must be positive."),
  billDate: z.string().optional(),
  billTotal: z.number().optional(),
  billVakkal: z.string().optional(),
});


export const paymentSchema = z.object({
    partyId: z.string().min(1, "Party must be selected."),
    amount: z.coerce.number().optional(),
    paymentMethod: z.enum(['Cash', 'Bank', 'UPI']).optional(),
    paymentType: z.enum(['Cash', 'Stock']),
    notes: z.string().optional(),
    source: z.string().optional(),
    stockItems: z.array(paymentStockItemSchema).optional(),
    transactionType: z.enum(['On Account', 'Against Bill']),
    againstBills: z.array(billAllocationSchema).optional(),
}).superRefine((data, ctx) => {
    if (data.paymentType === 'Cash' && (!data.amount || data.amount <= 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["amount"],
            message: "Amount is required for a cash payment.",
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
