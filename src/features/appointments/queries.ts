import "server-only";
import { readSalon } from "@/features/salon/queries";
import { appointmentRowSchema, bookingServiceRowSchema } from "./schemas";
export function listAppointments(from?: string, to?: string) {
  return readSalon("appointments", appointmentRowSchema.array(), from, to).then(
    (rows) =>
      rows.sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at)),
  );
}
export function listBookingServices() {
  return readSalon("booking_services", bookingServiceRowSchema.array());
}
