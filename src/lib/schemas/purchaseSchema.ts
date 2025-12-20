import { z } from "zod";

export const purchaseItemSchema = z.object({
  lotNumber: z.string().min(1, "Lot number is required."),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  netWeight: z.coerce.number().min(0.01, "Net weight must be positive."),
  rate: z.coerce.number().min(0.01, "Rate must be positive."),
});

export const expenseSchema = z.object({
  id: z.string(),
  account: z.string().min(1, "Account is required."),
  amount: z.coerce.number().min(0.01, "Amount must be positive."),
  paymentMode: z.enum(["Cash", "Bank", "Pending"]),
  partyId: z.string().optional(),
  partyName: z.string().optional(),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  agentId: z.string().optional(),
  locationId: z.string().min(1, "Location/Warehouse is required."),
  transporterId: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required."),
  expenses: z.array(expenseSchema).optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
