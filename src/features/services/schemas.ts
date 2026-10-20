import { z } from "zod";
import { money } from "@/features/salon/schemas";
export const serviceSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  price_php: money,
  duration_minutes: z.number().int().min(5).max(720),
  buffer_minutes: z.number().int().min(0).max(180),
  active: z.boolean(),
});
export const serviceRowSchema = serviceSchema.extend({
  id: z.uuid(),
  organization_id: z.uuid(),
  price_php: z.coerce.string(),
});
export type Service = z.infer<typeof serviceRowSchema>;
