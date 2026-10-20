import { z } from "zod";

export const money = z
  .string()
  .regex(
    /^\d{1,10}(\.\d{1,2})?$/,
    "Enter a PHP amount with at most two decimals.",
  );
export const date = z.iso.date();
export const localTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .refine(
    (v) =>
      z.iso.date().safeParse(v.slice(0, 10)).success &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(v.slice(11)) &&
      !Number.isNaN(Date.parse(`${v}:00+08:00`)),
    "Enter a valid Manila date and time.",
  );
export const hoursSchema = z.object(
  Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [
      String(i),
      z
        .tuple([
          z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        ])
        .refine((v) => v[0] < v[1], "Closing must follow opening.")
        .nullable(),
    ]),
  ),
);
export const salonSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
});
export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  opening_hours: hoursSchema,
  closed_dates: z.array(date).max(366),
  slot_minutes: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(30),
    z.literal(60),
  ]),
  payroll_frequency: z.enum(["weekly", "semi_monthly", "custom"]),
  monthly_divisor: money.refine((v) => Number(v) > 0 && Number(v) <= 366),
});
export const memberSchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "manager", "staff"]),
});
export const settingsRowSchema = settingsSchema.omit({ name: true }).extend({
  organization_id: z.uuid(),
  timezone: z.literal("Asia/Manila"),
  monthly_divisor: z.coerce.string(),
  updated_at: z.string(),
});
