"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { isCalendarDate } from "@/lib/calendar";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RecordDialog, type Field } from "@/components/shared/record-form";
import { MutationButton } from "@/components/shared/mutation-button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  addDays,
  businessDate,
  dateTime,
  php,
  toLocalInput,
  estimateEnd,
  centavos,
  decimal,
} from "@/features/salon/domain";
import type { Staff } from "@/features/staff/schemas";
import type { Service } from "@/features/services/schemas";
import {
  bookingSchema,
  type Appointment,
  type BookingService,
} from "../schemas";
import { nextStatuses } from "../domain";
import { saveBookingAction, transitionBookingAction } from "../actions";
import { ScheduleGrid } from "./schedule-grid";
import { AppointmentStatusBadge } from "./appointment-status-badge";
const statusLabels: Record<Appointment["status"], string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  in_service: "In service",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};
const actionLabels: Partial<Record<Appointment["status"], string>> = {
  checked_in: "Check in",
  in_service: "Start service",
  completed: "Mark completed",
  cancelled: "Cancel booking",
  no_show: "Mark no-show",
};
export function AppointmentCalendar({
  appointments,
  bookingServices,
  staff,
  services,
  customers,
  canManage,
  date,
  slotMinutes,
  history = [],
}: {
  appointments: Appointment[];
  bookingServices: BookingService[];
  staff: Staff[];
  services: Service[];
  customers: { id: string; name: string }[];
  canManage: boolean;
  date: string;
  slotMinutes: number;
  history?: {
    id: number;
    entity_id: string | null;
    action: string;
    occurred_at: string;
    new_data: { status?: unknown } | null;
  }[];
}) {
  const router = useRouter();
  const [view, setView] = useState("week");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const weekStart = addDays(
    date,
    -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7),
  );
  const days = Array.from({ length: view === "week" ? 7 : 1 }, (_, i) =>
    addDays(view === "week" ? weekStart : date, i),
  );
  const filtered = appointments.filter(
    (a) =>
      (!employee || a.staff_id === employee) &&
      (!status || a.status === status) &&
      `${a.walk_in_name} ${customers.find((c) => c.id === a.customer_id)?.name ?? ""} ${bookingServices
        .filter((s) => s.appointment_id === a.id)
        .map((s) => s.name_snapshot)
        .join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function go(next: string) {
    router.push(`/appointments?date=${next}`);
  }
  const form = (appointment?: Appointment) => {
    const selected = bookingServices
      .filter((s) => s.appointment_id === appointment?.id)
      .sort((a, b) => a.position - b.position);
    const fields: Field[] = [
      {
        name: "customer_id",
        label: "Customer",
        kind: "select",
        options: [
          { value: "", label: "Walk-in / no contact" },
          ...customers.map((c) => ({ value: c.id, label: c.name })),
        ],
      },
      { name: "walk_in_name", label: "Walk-in name (optional)" },
      {
        name: "staff_id",
        label: "Assigned employee",
        kind: "select",
        options: [
          { value: "", label: "Choose employee" },
          ...staff
            .filter((s) => s.active || s.id === appointment?.staff_id)
            .map((s) => ({ value: s.id, label: s.display_name })),
        ],
      },
      {
        name: "start_at",
        label: "Start · Asia/Manila",
        kind: "datetime-local",
        step: String(slotMinutes * 60),
      },
      {
        name: "service_ids",
        label: "Services (sequential)",
        kind: "cards",
        options: services
          .filter(
            (s) => s.active || selected.some((x) => x.service_id === s.id),
          )
          .map((s) => ({
            value: s.id,
            label: s.name,
            description: `${s.category} · ${s.duration_minutes} min`,
            detail: php(s.price_php),
          })),
        hint: "Choose one or more services. Services run sequentially; end time includes cleanup buffers.",
      },
      { name: "notes", label: "Booking notes", kind: "textarea" },
    ];
    return (
      <RecordDialog
        title={appointment ? "Edit appointment" : "New appointment"}
        triggerLabel={appointment ? "Edit / reschedule" : "New booking"}
        triggerVariant={appointment ? "outline" : "default"}
        description="Choose services, a team member and a start time. Availability is checked when you save."
        schema={bookingSchema}
        defaults={
          appointment
            ? {
                id: appointment.id,
                staff_id: appointment.staff_id,
                customer_id: appointment.customer_id ?? "",
                walk_in_name: appointment.walk_in_name,
                start_at: toLocalInput(appointment.start_at),
                service_ids: selected.map((s) => s.service_id),
                notes: appointment.notes,
              }
            : {
                staff_id: "",
                customer_id: "",
                walk_in_name: "",
                start_at: `${date}T09:00`,
                service_ids: [],
                notes: "",
              }
        }
        fields={fields}
        action={saveBookingAction}
        submitLabel="Save appointment"
        preview={(values) => {
          const ids = values.service_ids as string[];
          const unchanged =
            appointment &&
            JSON.stringify(ids) ===
              JSON.stringify(selected.map((s) => s.service_id));
          const picks = unchanged
            ? selected
            : services.filter((s) => ids.includes(s.id));
          const minutes = picks.reduce(
            (n, s) => n + s.duration_minutes + s.buffer_minutes,
            0,
          );
          const end =
            values.start_at && minutes
              ? estimateEnd(String(values.start_at), minutes)
              : null;
          return (
            <div className="rounded-xl bg-primary/5 p-4 text-sm">
              <p className="font-medium">
                {end && !Number.isNaN(Date.parse(end))
                  ? `Estimated end: ${dateTime(end)}`
                  : "Select services to preview the appointment."}
              </p>
              <p className="mt-1 text-muted-foreground">
                {minutes} minutes including buffer ·{" "}
                {php(
                  decimal(
                    picks.reduce((n, s) => n + centavos(s.price_php), 0n),
                  ),
                )}
              </p>
            </div>
          );
        }}
      />
    );
  };
  function event(a: Appointment, compact = false) {
    const picks = bookingServices.filter((s) => s.appointment_id === a.id);
    const category =
      services.find((s) => s.id === picks[0]?.service_id)?.category ??
      "General";
    const color = [
      "border-teal-500 bg-teal-50 text-teal-800",
      "border-violet-500 bg-violet-50 text-violet-800",
      "border-blue-500 bg-blue-50 text-blue-800",
      "border-amber-500 bg-amber-50 text-amber-800",
    ][Array.from(category).reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4];
    return (
      <Dialog key={a.id}>
        <DialogTrigger
          render={
            <button
              className={`w-full rounded-[10px] border-l-[3px] text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary ${compact ? "h-full overflow-hidden px-2 py-1.5" : "p-3"} ${color}`}
            />
          }
        >
          {compact ? (
            <>
              <span className="block truncate text-[10px] leading-3 font-bold">
                {new Intl.DateTimeFormat("en-PH", {
                  timeZone: "Asia/Manila",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(a.start_at))}{" "}
                ·{" "}
                {customers.find((c) => c.id === a.customer_id)?.name ??
                  a.walk_in_name}
              </span>
              <span className="mt-0.5 block truncate text-[9px] leading-3 opacity-75">
                {picks.map((s) => s.name_snapshot).join(" + ")}
              </span>
              <span className="sr-only">{statusLabels[a.status]}</span>
            </>
          ) : (
            <>
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-primary">
                  {new Intl.DateTimeFormat("en-PH", {
                    timeZone: "Asia/Manila",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(a.start_at))}
                </span>
                <AppointmentStatusBadge status={a.status} />
              </span>
              <span className="mt-2 block text-sm font-semibold">
                {customers.find((c) => c.id === a.customer_id)?.name ??
                  a.walk_in_name}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {picks.map((s) => s.name_snapshot).join(" + ")}
              </span>
              <span className="mt-2 block text-xs text-muted-foreground">
                {staff.find((s) => s.id === a.staff_id)?.display_name ??
                  "Assigned employee"}
              </span>
            </>
          )}
        </DialogTrigger>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {customers.find((c) => c.id === a.customer_id)?.name ??
                a.walk_in_name}
            </DialogTitle>
            <DialogDescription>
              {dateTime(a.start_at)} – {dateTime(a.end_at)} · Asia/Manila
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Badge>{statusLabels[a.status]}</Badge>
            <p className="text-sm">
              {staff.find((s) => s.id === a.staff_id)?.display_name ??
                "Assigned employee"}
            </p>
            <div className="divide-y">
              {picks.map((s) => (
                <p
                  key={s.id}
                  className="flex justify-between gap-3 py-2 text-sm"
                >
                  <span>
                    {s.name_snapshot} · {s.duration_minutes} min
                  </span>
                  <span>{php(s.price_php)}</span>
                </p>
              ))}
            </div>
            {a.notes && (
              <p className="rounded-lg bg-muted p-3 text-sm">{a.notes}</p>
            )}
            {canManage && (
              <div className="flex flex-wrap gap-2">
                {["scheduled", "checked_in"].includes(a.status) && form(a)}
                {nextStatuses(a.status).map((next) => (
                  <MutationButton
                    key={next}
                    label={actionLabels[next] ?? next}
                    description={
                      next === "completed"
                        ? "This freezes the booked commission basis and records earned commission once."
                        : "Update this appointment and its audit history."
                    }
                    action={transitionBookingAction}
                    input={{ id: a.id, status: next }}
                  />
                ))}
              </div>
            )}
            {history.some((h) => h.entity_id === a.id) && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">
                  Status history
                </summary>
                <ol className="mt-2 space-y-2">
                  {history
                    .filter((h) => h.entity_id === a.id)
                    .map((h) => (
                      <li key={h.id}>
                        {dateTime(h.occurred_at)} ·{" "}
                        {String(h.new_data?.status ?? h.action)}
                      </li>
                    ))}
                </ol>
              </details>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  const agenda = (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day} className="space-y-3">
          <h2 className="text-sm font-semibold">
            {new Intl.DateTimeFormat("en-PH", {
              timeZone: "Asia/Manila",
              weekday: "long",
              month: "short",
              day: "numeric",
            }).format(new Date(`${day}T00:00:00+08:00`))}
          </h2>
          {filtered
            .filter((a) => businessDate(a.start_at) === day)
            .map((a) => event(a))}
          {!filtered.some((a) => businessDate(a.start_at) === day) && (
            <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              No appointments.
            </p>
          )}
        </section>
      ))}
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-[13px] bg-muted p-1 text-xs font-medium">
          {["day", "week", "list"].map((v) => (
            <Button
              key={v}
              size="sm"
              variant="ghost"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`h-8 rounded-[10px] px-3 text-xs capitalize ${view === v ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {v}
            </Button>
          ))}
        </div>
        {canManage && form()}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous date"
            onClick={() => go(addDays(date, view === "week" ? -7 : -1))}
          >
            <ChevronLeft />
          </Button>
          <DatePicker
            label="Calendar date"
            aria-label="Calendar date"
            value={date}
            onValueChange={(value) => {
              if (isCalendarDate(value)) go(value);
            }}
            className="w-40"
          />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next date"
            onClick={() => go(addDays(date, view === "week" ? 7 : 1))}
          >
            <ChevronRight />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => go(businessDate())}
          >
            Today
          </Button>
        </div>
        <Select
          className="w-auto min-w-40"
          aria-label="Filter employee"
          value={employee}
          onValueChange={setEmployee}
          options={[
            { value: "", label: "All employees" },
            ...staff.map((s) => ({ value: s.id, label: s.display_name })),
          ]}
        />
        <Select
          className="w-auto"
          aria-label="Filter booking status"
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            ...Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <Input
          className="max-w-xs"
          placeholder="Search appointments…"
          aria-label="Search appointments"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {!staff.length && canManage ? (
        <EmptyState
          icon={<CalendarDays />}
          title="Set up your team first"
          description="Add employees and services to create your first booking."
        />
      ) : (
        <>
          {view !== "list" && (
            <div className="hidden md:block">
              <ScheduleGrid
                columns={
                  view === "week"
                    ? days.map((day) => ({
                        id: day,
                        label: new Intl.DateTimeFormat("en-PH", {
                          weekday: "short",
                          timeZone: "UTC",
                        }).format(new Date(day + "T00:00:00Z")),
                        detail: day.slice(8),
                        selected: day === date,
                        onSelect: () => go(day),
                        appointments: filtered.filter(
                          (a) => businessDate(a.start_at) === day,
                        ),
                      }))
                    : staff
                        .filter((s) => !employee || s.id === employee)
                        .map((s) => ({
                          id: s.id,
                          label: s.display_name,
                          appointments: filtered.filter(
                            (a) =>
                              a.staff_id === s.id &&
                              businessDate(a.start_at) === date,
                          ),
                        }))
                }
                renderEvent={event}
              />
            </div>
          )}
          <div className={view === "list" ? "" : "md:hidden"}>{agenda}</div>
        </>
      )}
    </div>
  );
}
