import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  ClipboardCheck,
  CircleAlert,
  Plus,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MutationButton } from "@/components/shared/mutation-button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { hasPermission } from "@/features/auth/permissions";
import { requireSalon } from "@/features/salon/queries";
import { businessDate, dateTime, hasStaleShift } from "@/features/salon/domain";
import {
  listAppointments,
  listBookingServices,
} from "@/features/appointments/queries";
import { transitionBookingAction } from "@/features/appointments/actions";
import { AppointmentStatusBadge } from "@/features/appointments/components/appointment-status-badge";
import { listAttendance } from "@/features/attendance/queries";
import { listStaff } from "@/features/staff/queries";
import { listPayrollPeriods } from "@/features/payroll/queries";
import { cn } from "@/lib/utils";
export default async function DashboardPage() {
  const salon = await requireSalon(),
    today = businessDate();
  const canPay = hasPermission(salon.role, "payroll:manage"),
    canReview = hasPermission(salon.role, "attendance:read"),
    canBook = hasPermission(salon.role, "appointments:manage");
  const [appointments, services, attendance, staff, periods] =
    await Promise.all([
      listAppointments(today, today),
      listBookingServices(),
      listAttendance(),
      listStaff(),
      canPay ? listPayrollPeriods() : Promise.resolve([]),
    ]);
  const pending = attendance.filter((e) =>
      ["submitted", "corrected"].includes(e.status),
    ),
    open = attendance.filter((e) => !e.clock_out_at),
    payrollPending = periods.filter((p) =>
      ["calculated", "reviewed"].includes(p.status),
    ),
    waiting = appointments.filter((a) => a.status === "checked_in");
  const metrics = [
    {
      label: "Appointments today",
      value: appointments.filter(
        (a) => !["cancelled", "no_show"].includes(a.status),
      ).length,
      icon: CalendarDays,
      href: "/appointments",
    },
    {
      label: canReview ? "Staff on duty" : "Your open shifts",
      value: open.length,
      icon: Clock3,
      href: canReview ? "/attendance" : "/my-attendance",
    },
    {
      label: canReview ? "Shifts to review" : "Your shifts awaiting review",
      value: pending.length,
      icon: ClipboardCheck,
      href: canReview ? "/attendance" : "/my-attendance",
    },
    ...(canPay
      ? [
          {
            label: "Payroll to review",
            value: payrollPending.length,
            icon: Wallet,
            href: "/payroll",
          },
        ]
      : []),
  ];
  const attention = [
    ...(waiting.length
      ? [
          {
            label: `${waiting.length} client${waiting.length === 1 ? "" : "s"} waiting`,
            detail: waiting[0].walk_in_name,
            href: "/appointments",
            tone: "bg-amber-500",
          },
        ]
      : []),
    ...(pending.length
      ? [
          {
            label: `${pending.length} shift${pending.length === 1 ? "" : "s"} to review`,
            detail: "Confirm time and approved breaks",
            href: canReview ? "/attendance" : "/my-attendance",
            tone: "bg-orange-500",
          },
        ]
      : []),
    ...(payrollPending.length
      ? [
          {
            label: `${payrollPending.length} payroll cutoff${payrollPending.length === 1 ? "" : "s"} to review`,
            detail: "Reconcile attendance and service earnings",
            href: "/payroll",
            tone: "bg-violet-500",
          },
        ]
      : []),
  ];
  const time = (v: string) =>
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(v));
  const nextAction = {
    scheduled: { label: "Check in", status: "checked_in" },
    checked_in: { label: "Start service", status: "in_service" },
    in_service: { label: "Complete", status: "completed" },
  };
  return (
    <div className="page-wrap animate-rise-in">
      <PageHeader
        eyebrow="Daily operations"
        title="Today"
        description={`${new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${today}T00:00:00+08:00`))} · ${salon.name}`}
        action={
          <Link href="/appointments" className={buttonVariants()}>
            <Plus />
            {canBook ? "New appointment" : "View appointments"}
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-[14px] bg-muted/45 p-4 transition-colors hover:bg-muted/80"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-muted-foreground">
                {m.label}
              </p>
              <m.icon className="size-3.5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-[26px] leading-tight font-semibold tracking-[-0.04em] tabular-nums">
              {m.value}
            </p>
          </Link>
        ))}
      </div>
      {attention.length > 0 && (
        <section
          id="needs-attention"
          aria-labelledby="attention-title"
          className="flex scroll-mt-4 flex-col gap-1 rounded-[14px] bg-muted/55 p-2 md:flex-row md:items-stretch"
        >
          <div className="flex min-h-11 items-center gap-2 px-2.5 md:w-[168px] md:shrink-0">
            <CircleAlert className="size-4 text-amber-600" />
            <h2 id="attention-title" className="text-[12px] font-semibold">
              Needs attention
            </h2>
            <Badge
              variant="secondary"
              className="ml-auto size-5 justify-center rounded-full p-0 text-[10px] text-muted-foreground"
            >
              {attention.length}
            </Badge>
          </div>
          <div className="hidden w-px bg-border md:block" />
          <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {attention.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex min-h-12 items-center gap-3 rounded-[11px] px-3 py-2 hover:bg-card/70"
              >
                <span
                  className={cn("size-2 shrink-0 rounded-full", item.tone)}
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="pt-1" aria-labelledby="today-schedule">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2
              id="today-schedule"
              className="text-base font-semibold tracking-[-0.02em]"
            >
              Today’s schedule
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {appointments.length} appointments ·{" "}
              {new Set(appointments.map((a) => a.staff_id)).size} employees ·
              Asia/Manila
            </p>
          </div>
          <Link
            href="/appointments"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "text-xs",
            })}
          >
            Full calendar <ArrowUpRight />
          </Link>
        </div>
        <div className="overflow-hidden rounded-[14px] shadow-[0_1px_2px_rgba(15,23,42,0.03)] ring-1 ring-border/70">
          {appointments.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden w-[110px] md:table-cell">
                    Time
                  </TableHead>
                  <TableHead>Client &amp; service</TableHead>
                  <TableHead className="hidden w-[160px] md:table-cell">
                    Employee
                  </TableHead>
                  <TableHead className="hidden w-[135px] sm:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="hidden w-[125px] lg:table-cell">
                    Next step
                  </TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => {
                  const person = staff.find((s) => s.id === a.staff_id),
                    terminal = ["completed", "cancelled", "no_show"].includes(
                      a.status,
                    ),
                    next = nextAction[a.status as keyof typeof nextAction];
                  return (
                    <TableRow
                      key={a.id}
                      className={cn(
                        terminal && "bg-muted/20",
                        a.status === "checked_in" && "bg-accent/25",
                      )}
                    >
                      <TableCell className="hidden md:table-cell">
                        <span className="block text-[12px] font-semibold tabular-nums">
                          {time(a.start_at)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground tabular-nums">
                          <Clock3 className="size-2.5" />
                          {time(a.end_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/appointments?date=${today}`}
                          className="group flex items-center gap-3"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-[13px] bg-accent text-[11px] font-semibold">
                            {a.walk_in_name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((s) => s[0])
                              .join("")}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold group-hover:text-primary">
                              {a.walk_in_name}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">
                              {services
                                .filter((s) => s.appointment_id === a.id)
                                .map((s) => s.name_snapshot)
                                .join(" · ")}
                            </span>
                            <span className="mt-1 block text-[10px] text-muted-foreground md:hidden">
                              {time(a.start_at)} ·{" "}
                              {person?.display_name ?? "Assigned employee"}
                            </span>
                            <span className="mt-2 block sm:hidden">
                              <AppointmentStatusBadge status={a.status} />
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-[11px] font-medium md:table-cell">
                        {person?.display_name ?? "Assigned employee"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <AppointmentStatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {next && canBook ? (
                          <MutationButton
                            label={next.label}
                            description="Update this appointment and record its status history."
                            action={transitionBookingAction}
                            input={{ id: a.id, status: next.status }}
                            className="h-8 rounded-[9px] px-3 text-[11px]"
                          />
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {terminal ? "Finished" : "View booking"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/appointments?date=${today}`}
                          aria-label={`View ${a.walk_in_name} appointment`}
                          className="grid size-7 place-items-center rounded-[9px] text-muted-foreground hover:bg-muted"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<CalendarDays />}
              title="No appointments today"
              description="The schedule is clear. Add an appointment when your salon is ready."
            />
          )}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[14px] bg-muted/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[12px] font-semibold">
              {canReview ? "Team attendance" : "Your attendance"}
            </h2>
            <Link
              href={canReview ? "/attendance" : "/my-attendance"}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              View shifts <span aria-hidden>↗</span>
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {open.length ? (
              open.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[11px] font-medium">
                      {staff.find((s) => s.id === e.staff_id)?.display_name ??
                        "Your shift"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Since {dateTime(e.clock_in_at)}
                    </p>
                  </div>
                  <Badge variant="success">
                    <span className="size-1.5 rounded-full bg-current" />
                    On duty
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-[11px] leading-5 text-muted-foreground">
                No one is clocked in yet. Shifts appear here as your team starts
                their day.
              </p>
            )}
            {hasStaleShift(open) && (
              <Link
                href={canReview ? "/attendance" : "/my-attendance"}
                className="block text-[11px] text-amber-700"
              >
                Review shifts open longer than 16 hours →
              </Link>
            )}
          </div>
        </section>
        <section className="rounded-[14px] bg-muted/40 p-5">
          <h2 className="text-[12px] font-semibold">
            {canPay ? "Payroll desk" : "Your working day"}
          </h2>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            {canPay
              ? `${payrollPending.length} cutoff${payrollPending.length === 1 ? "" : "s"} awaiting review. Pay is based on approved time and completed services.`
              : "Keep your shifts up to date and view finalized statements in My payslips."}
          </p>
          <Link
            href={canPay ? "/payroll" : "/my-payslips"}
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium"
          >
            {canPay ? "Review payroll" : "My payslips"}
            <ArrowRight className="size-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}
