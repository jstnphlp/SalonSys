import { z } from "zod";
import { localTime } from "@/features/salon/schemas";
export const punchSchema = z.enum(["in", "out"]);
export const correctionSchema = z
  .object({
    id: z.uuid().optional(),
    staff_id: z.uuid(),
    clock_in_at: localTime,
    clock_out_at: localTime,
    break_minutes: z.number().int().min(0).max(1440),
    correction_reason: z.string().trim().min(3).max(500),
  })
  .refine(
    (v) => Date.parse(v.clock_out_at) > Date.parse(v.clock_in_at),
    "Clock out must follow clock in.",
  )
  .refine(
    (v) =>
      (Date.parse(v.clock_out_at) - Date.parse(v.clock_in_at)) / 60000 >=
      v.break_minutes,
    "Break exceeds shift length.",
  );
export const attendanceRowSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  staff_id: z.uuid(),
  clock_in_at: z.string(),
  clock_out_at: z.string().nullable(),
  break_minutes: z.number(),
  status: z.enum(["open", "submitted", "corrected", "approved"]),
  correction_reason: z.string().nullable(),
  approved_at: z.string().nullable(),
  approved_by: z.uuid().nullable(),
});
export const auditRowSchema = z.object({
  id: z.number(),
  entity_id: z.uuid().nullable(),
  action: z.string(),
  occurred_at: z.string(),
  actor_user_id: z.uuid().nullable(),
  old_data: z
    .object({
      clock_in_at: z.string().nullable().optional(),
      clock_out_at: z.string().nullable().optional(),
      break_minutes: z.number().optional(),
    })
    .nullable(),
  new_data: z
    .object({
      reason: z.string().nullable(),
      clock_in_at: z.string().nullable().optional(),
      clock_out_at: z.string().nullable().optional(),
      break_minutes: z.number().optional(),
    })
    .passthrough()
    .nullable(),
});
export type Attendance = z.infer<typeof attendanceRowSchema>;
export type AttendanceAudit = z.infer<typeof auditRowSchema>;
