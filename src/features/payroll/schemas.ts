import { z } from "zod";
import { date, money } from "@/features/salon/schemas";
export const periodSchema = z
  .object({ start_date: date, end_date: date })
  .refine(
    (v) =>
      v.end_date >= v.start_date &&
      (Date.parse(v.end_date) - Date.parse(v.start_date)) / 86400000 <= 62,
    "Choose an inclusive cutoff of 1 to 63 days.",
  );
export const payrollTransitionSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(["reviewed", "approved", "paid"]),
    reference: z.string().trim().max(160).default(""),
  })
  .refine(
    (v) => v.status !== "paid" || v.reference.length >= 3,
    "Enter payment method and reference.",
  );
export const adjustmentSchema = z
  .object({
    item_id: z.uuid(),
    kind: z.enum(["allowance", "adjustment", "deduction"]),
    description: z.string().trim().min(3).max(500),
    amount: z.string().regex(/^-?\d{1,10}(\.\d{1,2})?$/),
  })
  .refine(
    (v) =>
      Number(v.amount) !== 0 &&
      (v.kind === "adjustment" || !v.amount.startsWith("-")),
    "Enter a nonzero amount; use a positive amount for a deduction or allowance.",
  );
export const periodRowSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  start_date: date,
  end_date: date,
  status: z.enum(["calculated", "reviewed", "approved", "paid"]),
  approved_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  paid_reference: z.string().nullable(),
});
export const itemRowSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  payroll_period_id: z.uuid(),
  staff_id: z.uuid(),
  employee_name: z.string(),
  basis_snapshot: z.object({
    basis: z.enum(["hourly", "daily", "monthly"]),
    rate: z.coerce.string(),
    monthly_divisor: z.coerce.string(),
    effective_from: date,
  }),
  approved_minutes: z.coerce.string(),
  approved_days: z.number(),
  base_php: z.coerce.string(),
  commissions_php: z.coerce.string(),
  additions_php: z.coerce.string(),
  deductions_php: z.coerce.string(),
  net_php: z.coerce.string(),
});
export const lineRowSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  payroll_item_id: z.uuid(),
  kind: z.enum([
    "base",
    "attendance",
    "commission",
    "allowance",
    "adjustment",
    "deduction",
  ]),
  description: z.string(),
  amount_php: z.coerce.string(),
  attendance_id: z.uuid().nullable(),
  commission_id: z.uuid().nullable(),
});
export type PayrollPeriod = z.infer<typeof periodRowSchema>;
export type PayrollItem = z.infer<typeof itemRowSchema>;
export type PayrollLine = z.infer<typeof lineRowSchema>;
// Money validation is shared with compensation; no statutory rates are embedded.
export const positiveMoney = money;
