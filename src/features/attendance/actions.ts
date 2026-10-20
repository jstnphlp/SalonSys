"use server";
import { z } from "zod";
import { salonMutation } from "@/features/salon/mutations";
import { toUtc } from "@/features/salon/domain";
import { punchSchema, correctionSchema } from "./schemas";
export async function punchAction(input: unknown) {
  return salonMutation(
    input,
    punchSchema,
    "attendance:clock",
    (db, org, v) => db.rpc("punch_attendance", { p_org: org, p_direction: v }),
    "Attendance recorded.",
  );
}
export async function correctAttendanceAction(input: unknown) {
  return salonMutation(
    input,
    correctionSchema,
    "attendance:manage",
    (db, org, v) =>
      db.rpc("review_attendance", {
        p_org: org,
        p_data: {
          ...v,
          operation: "correct",
          clock_in_at: toUtc(v.clock_in_at),
          clock_out_at: toUtc(v.clock_out_at),
        },
      }),
    "Correction recorded. Review and approve it before payroll.",
  );
}
export async function approveAttendanceAction(input: unknown) {
  return salonMutation(
    input,
    z.uuid(),
    "attendance:manage",
    (db, org, v) =>
      db.rpc("review_attendance", {
        p_org: org,
        p_data: { id: v, operation: "approve" },
      }),
    "Attendance approved.",
  );
}
