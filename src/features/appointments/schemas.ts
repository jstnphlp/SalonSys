import { z } from "zod";
import { localTime } from "@/features/salon/schemas";
export const bookingSchema = z.object({
  id: z.uuid().optional(),
  staff_id: z.uuid(),
  customer_id: z.union([z.uuid(), z.literal("")]),
  walk_in_name: z.string().trim().max(120),
  start_at: localTime,
  service_ids: z
    .array(z.uuid())
    .min(1, "Choose a service.")
    .max(12)
    .refine((v) => new Set(v).size === v.length, "Choose each service once."),
  notes: z.string().trim().max(2000),
});
export const bookingStatus = z.enum([
  "scheduled",
  "checked_in",
  "in_service",
  "completed",
  "cancelled",
  "no_show",
]);
export const bookingTransitionSchema = z.object({
  id: z.uuid(),
  status: bookingStatus,
});
export const appointmentRowSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  staff_id: z.uuid(),
  customer_id: z.uuid().nullable(),
  walk_in_name: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  status: bookingStatus,
  notes: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export const bookingServiceRowSchema = z.object({
  id: z.uuid(),
  appointment_id: z.uuid(),
  service_id: z.uuid(),
  position: z.number(),
  name_snapshot: z.string(),
  price_php: z.coerce.string(),
  duration_minutes: z.number(),
  buffer_minutes: z.number(),
});
export type Appointment = z.infer<typeof appointmentRowSchema>;
export type BookingService = z.infer<typeof bookingServiceRowSchema>;
