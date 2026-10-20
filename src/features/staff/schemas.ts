import { z } from "zod";
import { money, date, hoursSchema } from "@/features/salon/schemas";
export const staffSchema = z.object({
  id: z.uuid().optional(),
  display_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40),
  user_id: z.union([z.uuid(), z.literal("")]),
  hire_date: date,
  active: z.boolean(),
  working_hours: hoursSchema.nullable(),
  service_ids: z.array(z.uuid()).max(100),
});
export const staffRowSchema = staffSchema.omit({ service_ids: true }).extend({
  id: z.uuid(),
  organization_id: z.uuid(),
  phone: z.string().nullable(),
  user_id: z.uuid().nullable(),
});
export const compensationSchema = z
  .object({
    staff_id: z.uuid(),
    pay_basis: z.enum(["hourly", "daily", "monthly"]),
    rate_php: money,
    commission_type: z.enum(["none", "percent", "fixed"]),
    commission_value: money,
    effective_from: date,
  })
  .refine(
    (v) => v.commission_type !== "percent" || Number(v.commission_value) <= 100,
    "Percentage cannot exceed 100.",
  );
export const compensationRowSchema = z.object({
  staff_id: z.uuid(),
  organization_id: z.uuid(),
  pay_basis: z.enum(["hourly", "daily", "monthly"]),
  rate_php: z.coerce.string(),
  commission_type: z.enum(["none", "percent", "fixed"]),
  commission_value: z.coerce.string(),
  effective_from: date,
});
export const skillSchema = z.object({
  organization_id: z.uuid(),
  staff_id: z.uuid(),
  service_id: z.uuid(),
});
export type Staff = z.infer<typeof staffRowSchema>;
export type Compensation = z.infer<typeof compensationRowSchema>;
export const serviceCommissionSchema = z
  .object({
    staff_id: z.uuid(),
    service_id: z.uuid(),
    commission_type: z.enum(["none", "fixed", "percent"]),
    commission_value: money,
  })
  .refine(
    (v) => v.commission_type !== "percent" || Number(v.commission_value) <= 100,
    "Percentage cannot exceed 100.",
  );
export const serviceCommissionRowSchema = z.object({
  organization_id: z.uuid(),
  staff_id: z.uuid(),
  service_id: z.uuid(),
  commission_type: z.enum(["none", "fixed", "percent"]),
  commission_value: z.coerce.string(),
});
export type ServiceCommission = z.infer<typeof serviceCommissionRowSchema>;
