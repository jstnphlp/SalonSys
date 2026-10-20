import "server-only";
import { readSalon } from "@/features/salon/queries";
import { periodRowSchema, itemRowSchema, lineRowSchema } from "./schemas";
export function listPayrollPeriods() {
  return readSalon("periods", periodRowSchema.array());
}
export function listPayrollItems() {
  return readSalon("payroll_items", itemRowSchema.array());
}
export function listPayrollLines() {
  return readSalon("payroll_lines", lineRowSchema.array());
}
