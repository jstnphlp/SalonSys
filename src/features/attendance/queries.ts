import "server-only";
import { readSalon } from "@/features/salon/queries";
import { attendanceRowSchema, auditRowSchema } from "./schemas";
export function listAttendance(from?: string, to?: string) {
  return readSalon("attendance", attendanceRowSchema.array(), from, to);
}
export function listAttendanceAudit() {
  return readSalon("attendance_audit", auditRowSchema.array());
}
