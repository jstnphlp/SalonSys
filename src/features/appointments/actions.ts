"use server";
import { salonMutation } from "@/features/salon/mutations";
import { toUtc } from "@/features/salon/domain";
import { bookingSchema, bookingTransitionSchema } from "./schemas";
export async function saveBookingAction(input: unknown) {
  return salonMutation(
    input,
    bookingSchema,
    "appointments:manage",
    (db, org, v) =>
      db.rpc("save_booking", {
        p_org: org,
        p_data: { ...v, start_at: toUtc(v.start_at) },
      }),
    "Appointment saved.",
  );
}
export async function transitionBookingAction(input: unknown) {
  return salonMutation(
    input,
    bookingTransitionSchema,
    "appointments:manage",
    (db, org, v) =>
      db.rpc("transition_booking", {
        p_org: org,
        p_id: v.id,
        p_status: v.status,
      }),
    "Appointment updated.",
  );
}
