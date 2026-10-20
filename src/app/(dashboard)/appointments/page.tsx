import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { requireSalon, readSalon } from "@/features/salon/queries";
import { businessDate, addDays } from "@/features/salon/domain";
import { hasPermission } from "@/features/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { listServices } from "@/features/services/queries";
import { listStaff } from "@/features/staff/queries";
import {
  listAppointments,
  listBookingServices,
} from "@/features/appointments/queries";
import { AppointmentCalendar } from "@/features/appointments/components/appointment-calendar";
import { settingsRowSchema } from "@/features/salon/schemas";
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const salon = await requireSalon();
  const params = await searchParams;
  const date = z.iso.date().catch(businessDate()).parse(params.date);
  const canManage = hasPermission(salon.role, "appointments:manage");
  const db = await createClient();
  const settings = await readSalon("settings", settingsRowSchema);
  const [appointments, bookingServices, staff, services, contacts, history] =
    await Promise.all([
      listAppointments(addDays(date, -6), addDays(date, 6)),
      listBookingServices(),
      listStaff(),
      listServices(),
      canManage
        ? db
            .from("customers")
            .select("id,name")
            .eq("organization_id", salon.id)
            .order("name")
        : Promise.resolve({ data: [], error: null }),
      canManage
        ? readSalon(
            "booking_audit",
            z.array(
              z.object({
                id: z.number(),
                entity_id: z.string().nullable(),
                action: z.string(),
                occurred_at: z.string(),
                new_data: z
                  .object({ status: z.unknown().optional() })
                  .nullable(),
              }),
            ),
          )
        : Promise.resolve([]),
    ]);
  if (contacts.error) throw new Error("Customers could not be loaded.");
  const customers = z
    .array(z.object({ id: z.uuid(), name: z.string() }))
    .parse(contacts.data);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Your schedule"
        title="Appointments"
        description="A clear view of the day, with every client and service in place."
      />
      <AppointmentCalendar
        appointments={appointments}
        bookingServices={bookingServices}
        staff={staff}
        services={services}
        customers={customers}
        canManage={canManage}
        date={date}
        slotMinutes={settings.slot_minutes}
        history={history}
      />
    </div>
  );
}
