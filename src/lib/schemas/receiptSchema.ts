import { z } from 'zod';

export const receiptBillSchema = z.object({
  billId: z.string(),
  amount: z.coerce.number().positive("Allocation must be positive."),
  billDate: z.string().optional(),
  billTotal: z.number().optional(),
  billVakkal: z.string().optional(),
});

export const receiptSchema = z.object({
    date: z.date({ required_error: "Receipt date is required." }),
    partyId: z.string().min(1, "Party must be selected."),
    amount: z.coerce.number().positive("Amount must be positive."),
    paymentMethod: z.enum(['Cash', 'Bank', 'UPI']),
    transactionType: z.enum(['On Account', 'Against Bill']),
    source: z.string().optional(),
    notes: z.string().optional(),
    cashDiscount: z.coerce.number().optional(),
    againstBills: z.array(receiptBillSchema).optional()
}).superRefine((data, ctx) => {
    if (data.transactionType === 'Against Bill') {
        const totalAllocated = (data.againstBills || []).reduce((sum, bill) => sum + bill.amount, 0);
        const totalReceived = data.amount + (data.cashDiscount || 0);
        if (Math.abs(totalAllocated - totalReceived) > 0.01) { // allow for floating point inaccuracies
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["againstBills"],
                message: `Total allocated amount (₹${totalAllocated.toFixed(2)}) must equal total received amount (₹${totalReceived.toFixed(2)}).`
            });
        }
    }
});

export type ReceiptFormValues = z.infer<typeof receiptSchema>;
