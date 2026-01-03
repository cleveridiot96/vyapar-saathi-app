
import { z } from "zod";
import type { Sale, SaleReturn } from "@/lib/types";

export const saleReturnSchema = (sales: Sale[], existingSaleReturns: SaleReturn[], currentReturnId?: string) => z.object({
  date: z.date({ required_error: "Return date is required." }),
  originalSaleId: z.string().min(1, "Original sale must be selected."),
  originalLotNumber: z.string().min(1, "Original lot number must be selected."),
  quantityReturned: z.coerce.number().positive("Quantity must be positive."),
  netWeightReturned: z.coerce.number().positive("Net weight must be positive."),
  restockingFee: z.coerce.number().optional(),
  returnReason: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
    const originalSale = sales.find(p => p.id === data.originalSaleId);
    if (!originalSale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["originalSaleId"],
        message: "Selected sale not found.",
      });
      return;
    }

    const originalItem = originalSale.items.find(i => i.lotNumber === data.originalLotNumber);
    if (!originalItem) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["originalLotNumber"],
            message: "This lot number does not exist in the selected sale.",
        });
        return;
    }
    
    const previouslyReturnedQty = existingSaleReturns
        .filter(pr => pr.id !== currentReturnId && pr.originalLotNumber === data.originalLotNumber)
        .reduce((sum, pr) => sum + pr.quantityReturned, 0);

    if (data.quantityReturned > (originalItem.quantity - previouslyReturnedQty)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["quantityReturned"],
            message: `Cannot return more than available. Original: ${originalItem.quantity}, Already Returned: ${previouslyReturnedQty}.`,
        });
    }

    const previouslyReturnedNetWeight = existingSaleReturns
        .filter(pr => pr.id !== currentReturnId && pr.originalLotNumber === data.originalLotNumber)
        .reduce((sum, pr) => sum + pr.netWeightReturned, 0);

    if (data.netWeightReturned > (originalItem.netWeight - previouslyReturnedNetWeight)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["netWeightReturned"],
            message: `Weight exceeds available. Original: ${originalItem.netWeight.toFixed(2)}kg, Returned: ${previouslyReturnedNetWeight.toFixed(2)}kg.`,
        });
    }

});

export type SaleReturnFormValues = z.infer<ReturnType<typeof saleReturnSchema>>;
