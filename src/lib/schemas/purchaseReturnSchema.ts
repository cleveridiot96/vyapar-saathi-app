import { z } from "zod";
import type { Purchase, PurchaseReturn } from "@/lib/types";

export const purchaseReturnSchema = (purchases: Purchase[], existingPurchaseReturns: PurchaseReturn[], currentReturnId?: string) => z.object({
  date: z.date({ required_error: "Return date is required." }),
  originalPurchaseId: z.string().min(1, "Original purchase must be selected."),
  originalLotNumber: z.string().min(1, "Original lot number must be selected."),
  quantityReturned: z.coerce.number().positive("Quantity must be positive."),
  netWeightReturned: z.coerce.number().positive("Net weight must be positive."),
  returnReason: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
    const originalPurchase = purchases.find(p => p.id === data.originalPurchaseId);
    if (!originalPurchase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["originalPurchaseId"],
        message: "Selected purchase not found.",
      });
      return;
    }

    const originalItem = originalPurchase.items.find(i => i.lotNumber === data.originalLotNumber);
    if (!originalItem) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["originalLotNumber"],
            message: "This lot number does not exist in the selected purchase.",
        });
        return;
    }
    
    const previouslyReturnedQty = existingPurchaseReturns
        .filter(pr => pr.id !== currentReturnId && pr.originalLotNumber === data.originalLotNumber)
        .reduce((sum, pr) => sum + pr.quantityReturned, 0);

    const previouslyReturnedNetWeight = existingPurchaseReturns
        .filter(pr => pr.id !== currentReturnId && pr.originalLotNumber === data.originalLotNumber)
        .reduce((sum, pr) => sum + pr.netWeightReturned, 0);

    if (data.quantityReturned > (originalItem.quantity - previouslyReturnedQty)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["quantityReturned"],
            message: `Cannot return more than available. Original: ${originalItem.quantity}, Already Returned: ${previouslyReturnedQty}.`,
        });
    }

    if (data.netWeightReturned > (originalItem.netWeight - previouslyReturnedNetWeight)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["netWeightReturned"],
            message: `Weight exceeds available. Original: ${originalItem.netWeight.toFixed(2)}kg, Returned: ${previouslyReturnedNetWeight.toFixed(2)}kg.`,
        });
    }

});

export type PurchaseReturnFormValues = z.infer<ReturnType<typeof purchaseReturnSchema>>;
