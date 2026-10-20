import { z } from "zod";
import { money } from "@/features/salon/schemas";
export const serviceSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string({ error: "Enter a service name." })
    .trim()
    .min(1, "Enter a service name.")
    .max(120, "Keep the service name to 120 characters or fewer."),
  category: z
    .string({ error: "Enter a category." })
    .trim()
    .min(1, "Enter a category.")
    .max(80, "Keep the category to 80 characters or fewer."),
  price_php: money,
  duration_minutes: z
    .number({ error: "Enter the service duration in minutes." })
    .int("Use whole minutes for the duration.")
    .min(5, "Services must last at least 5 minutes.")
    .max(720, "Service duration cannot exceed 720 minutes."),
  buffer_minutes: z
    .number({ error: "Enter the cleanup time in minutes, or 0 for none." })
    .int("Use whole minutes for cleanup time.")
    .min(0, "Cleanup time cannot be negative.")
    .max(180, "Cleanup time cannot exceed 180 minutes."),
  active: z.boolean(),
});
export const serviceRowSchema = serviceSchema.extend({
  id: z.uuid(),
  organization_id: z.uuid(),
  price_php: z.coerce.string(),
});
export type Service = z.infer<typeof serviceRowSchema>;
