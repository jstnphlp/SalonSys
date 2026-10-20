"use server";
import { salonMutation } from "@/features/salon/mutations";
import {
  periodSchema,
  payrollTransitionSchema,
  adjustmentSchema,
} from "./schemas";
export async function calculatePayrollAction(input: unknown) {
  return salonMutation(
    input,
    periodSchema,
    "payroll:manage",
    (db, org, v) =>
      db.rpc("calculate_payroll", {
        p_org: org,
        p_start: v.start_date,
        p_end: v.end_date,
      }),
    "Payroll preview calculated.",
  );
}
export async function transitionPayrollAction(input: unknown) {
  return salonMutation(
    input,
    payrollTransitionSchema,
    "payroll:manage",
    (db, org, v) =>
      db.rpc("transition_payroll", {
        p_org: org,
        p_id: v.id,
        p_status: v.status,
        p_reference: v.reference,
      }),
    "Payroll updated.",
  );
}
export async function adjustPayrollAction(input: unknown) {
  return salonMutation(
    input,
    adjustmentSchema,
    "payroll:manage",
    (db, org, v) =>
      db.rpc("adjust_payroll", {
        p_org: org,
        p_item: v.item_id,
        p_kind: v.kind,
        p_description: v.description,
        p_amount: Number(v.amount),
      }),
    "Manual line item added. Review payroll again.",
  );
}
