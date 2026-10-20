import { z } from "zod";
import {
  hasPermission,
  type AppRole,
  type Permission,
} from "@/features/auth/permissions";
import { serviceSchema } from "@/features/services/schemas";
import {
  staffSchema,
  compensationSchema,
  serviceCommissionSchema,
} from "@/features/staff/schemas";
import {
  settingsSchema,
  salonSchema,
  memberSchema,
} from "@/features/salon/schemas";
import { bookingSchema } from "@/features/appointments/schemas";
import { nextStatuses, overlaps } from "@/features/appointments/domain";
import { correctionSchema } from "@/features/attendance/schemas";
import {
  adjustmentSchema,
  periodSchema,
  payrollTransitionSchema,
} from "@/features/payroll/schemas";
import {
  businessDate,
  centavos,
  decimal,
  toLocalInput,
} from "@/features/salon/domain";
import type { DemoRow, DemoState } from "./seed";

export class DemoError extends Error {
  constructor(
    message: string,
    public code = "P0001",
  ) {
    super(message);
  }
}
export const value = (row: DemoRow, key: string) => String(row[key] ?? "");
const roleSchema = z.enum(["admin", "manager", "staff"]);
export function demoRole(
  state: DemoState,
  user: string | null,
  org: string,
): AppRole | null {
  const member = state.tables.organization_memberships.find(
    (row) => row.organization_id === org && row.user_id === user,
  );
  return member ? roleSchema.parse(member.role) : null;
}
function check(
  state: DemoState,
  user: string | null,
  org: string,
  permission: Permission,
) {
  const role = demoRole(state, user, org);
  if (!role || !hasPermission(role, permission))
    throw new DemoError("Permission denied", "42501");
}
function scoped(state: DemoState, table: string, org: string, id: string) {
  const row = state.tables[table].find(
    (row) => row.id === id && row.organization_id === org,
  );
  if (!row)
    throw new DemoError(
      "A selected record does not belong to this salon.",
      "23503",
    );
  return row;
}
const ownStaff = (
  state: DemoState,
  user: string | null,
  org: string,
  id: unknown,
) =>
  state.tables.staff_profiles.some(
    (s) => s.organization_id === org && s.id === id && s.user_id === user,
  );
export function visibleDemoRows(
  state: DemoState,
  user: string | null,
  table: string,
): DemoRow[] {
  if (!user) return [];
  return (state.tables[table] ?? [])
    .filter((row) => {
      if (table === "profiles") return row.id === user;
      if (table === "organizations")
        return !!demoRole(state, user, value(row, "id"));
      const org = value(row, "organization_id"),
        role = demoRole(state, user, org);
      if (table === "file_records" && !org) return row.uploaded_by === user;
      if (!role) return false;
      const admin = role === "admin",
        manage = admin || role === "manager";
      if (table === "organization_memberships")
        return admin || row.user_id === user;
      if (
        [
          "staff_compensation",
          "service_commission_rules",
          "commission_earnings",
        ].includes(table)
      )
        return admin;
      if (table === "customers") return manage;
      if (table === "staff_profiles") return manage || row.user_id === user;
      if (table === "appointments" || table === "attendance_entries")
        return manage || ownStaff(state, user, org, row.staff_id);
      if (table === "appointment_services")
        return visibleDemoRows(state, user, "appointments").some(
          (a) => a.id === row.appointment_id,
        );
      if (table === "payroll_periods")
        return admin || ["approved", "paid"].includes(value(row, "status"));
      if (table === "payroll_items")
        return (
          admin ||
          (ownStaff(state, user, org, row.staff_id) &&
            state.tables.payroll_periods.some(
              (p) =>
                p.id === row.payroll_period_id &&
                ["approved", "paid"].includes(value(p, "status")),
            ))
        );
      if (table === "payroll_line_items")
        return visibleDemoRows(state, user, "payroll_items").some(
          (i) => i.id === row.payroll_item_id,
        );
      if (table === "audit_events") return manage;
      return [
        "services",
        "staff_services",
        "salon_settings",
        "file_records",
      ].includes(table);
    })
    .map((row) => {
      if (table !== "appointment_services") return row;
      const {
        commission_type: _type,
        commission_value: _amount,
        ...safe
      } = row;
      void _type;
      void _amount;
      return safe;
    });
}
export function auditDemo(
  state: DemoState,
  user: string | null,
  org: string,
  table: string,
  row: DemoRow,
  old: DemoRow | null = null,
  action = old ? "update" : "insert",
) {
  const metadata = (r: DemoRow) => ({
    status: r.status ?? null,
    role: r.role ?? null,
    reason: r.correction_reason ?? null,
    ...(table === "attendance_entries"
      ? {
          clock_in_at: r.clock_in_at,
          clock_out_at: r.clock_out_at,
          break_minutes: r.break_minutes,
        }
      : {}),
  });
  state.tables.audit_events.push({
    id: Math.max(0, ...state.tables.audit_events.map((r) => Number(r.id))) + 1,
    actor_user_id: user,
    organization_id: org,
    entity_type: table,
    entity_id: row.id ?? row.staff_id ?? org,
    action,
    old_data: old ? metadata(old) : null,
    new_data: metadata(row),
    occurred_at: new Date().toISOString(),
  });
}
const rounded = (n: bigint, d: bigint) => {
  if (d <= 0n) throw new DemoError("Invalid divisor");
  return n < 0n ? -((-n + d / 2n) / d) : (n + d / 2n) / d;
};
const put = (rows: DemoRow[], row: DemoRow, keys = ["id"]) => {
  const old = rows.find((r) => keys.every((k) => r[k] === row[k]));
  if (old) Object.assign(old, row);
  else rows.push(row);
};
function assertShift(state: DemoState, row: DemoRow) {
  const start = Date.parse(value(row, "clock_in_at")),
    end = row.clock_out_at ? Date.parse(value(row, "clock_out_at")) : Infinity;
  if (!(start < end) || Number(row.break_minutes) * 60000 > end - start)
    throw new DemoError("Invalid shift chronology or break duration.");
  if (
    state.tables.attendance_entries.some(
      (a) =>
        a.id !== row.id &&
        a.staff_id === row.staff_id &&
        Date.parse(value(a, "clock_in_at")) < end &&
        (a.clock_out_at ? Date.parse(value(a, "clock_out_at")) : Infinity) >
          start,
    )
  )
    throw new DemoError("This shift overlaps another attendance entry.");
}
function mutablePeriod(state: DemoState, org: string, id: string) {
  const period = scoped(state, "payroll_periods", org, id);
  if (["approved", "paid"].includes(value(period, "status")))
    throw new DemoError("Finalized payroll is immutable.");
  return period;
}
function command(
  state: DemoState,
  user: string | null,
  name: string,
  args: DemoRow,
): unknown {
  const org = String(args.p_org ?? ""),
    now = new Date().toISOString();
  const data = z.record(z.string(), z.unknown()).parse(args.p_data ?? {});
  if (name === "create_salon") {
    if (!user) throw new DemoError("Authentication required", "42501");
    const input = salonSchema.parse({ name: args.p_name, slug: args.p_slug });
    if (state.tables.organizations.some((o) => o.slug === input.slug))
      throw new DemoError("Workspace address already exists.", "23505");
    const id = crypto.randomUUID();
    state.tables.organizations.push({ ...input, id, created_by: user });
    state.tables.organization_memberships.push({
      organization_id: id,
      user_id: user,
      role: "admin",
    });
    state.tables.salon_settings.push({
      ...structuredClone(state.tables.salon_settings[0]),
      organization_id: id,
      updated_at: now,
    });
    auditDemo(state, user, id, "organizations", { id });
    return id;
  }
  check(state, user, org, "dashboard:view");
  if (name === "salon_read") {
    const map: Record<string, string> = {
      settings: "salon_settings",
      services: "services",
      staff: "staff_profiles",
      skills: "staff_services",
      compensation: "staff_compensation",
      commission_rules: "service_commission_rules",
      appointments: "appointments",
      booking_services: "appointment_services",
      attendance: "attendance_entries",
      periods: "payroll_periods",
      payroll_items: "payroll_items",
      payroll_lines: "payroll_line_items",
      booking_audit: "audit_events",
      attendance_audit: "audit_events",
    };
    const resource = String(args.p_resource),
      table = map[resource];
    if (!table) throw new DemoError("Unknown resource");
    if (["compensation", "commission_rules"].includes(resource))
      check(state, user, org, "payroll:manage");
    if (resource === "booking_audit")
      check(state, user, org, "appointments:manage");
    if (resource === "attendance_audit")
      check(state, user, org, "attendance:read");
    const rows = visibleDemoRows(state, user, table)
      .filter((r) => r.organization_id === org)
      .filter((r) => {
        if (resource.endsWith("_audit"))
          return (
            r.entity_type ===
            (resource === "booking_audit"
              ? "appointments"
              : "attendance_entries")
          );
        const time =
          resource === "appointments"
            ? r.start_at
            : resource === "attendance"
              ? r.clock_in_at
              : null;
        return (
          !time ||
          ((!args.p_from ||
            businessDate(String(time)) >= String(args.p_from)) &&
            (!args.p_to || businessDate(String(time)) <= String(args.p_to)))
        );
      });
    return resource === "settings" ? rows[0] : rows;
  }
  if (name === "salon_members") {
    check(state, user, org, "members:manage");
    return state.tables.organization_memberships
      .filter((m) => m.organization_id === org)
      .map((m) => {
        const p = state.tables.profiles.find((p) => p.id === m.user_id)!;
        return {
          user_id: p.id,
          name: p.full_name,
          email: p.email,
          role: m.role,
        };
      });
  }
  if (name === "save_salon_settings") {
    check(state, user, org, "settings:manage");
    const input = settingsSchema.parse(data);
    Object.assign(
      state.tables.organizations.find((o) => o.id === org)!,
      { name: input.name },
    );
    Object.assign(
      state.tables.salon_settings.find((s) => s.organization_id === org)!,
      input,
      { updated_at: now },
    );
    auditDemo(state, user, org, "salon_settings", { id: org });
    return null;
  }
  if (name === "set_salon_member") {
    check(state, user, org, "members:manage");
    const input = memberSchema.parse({
      email: args.p_email,
      role: args.p_role,
    });
    const account = state.tables.profiles.find(
      (p) => value(p, "email").toLowerCase() === input.email.toLowerCase(),
    );
    if (!account)
      throw new DemoError(
        "Account not found. Use one of the sample account emails.",
      );
    if (account.id === user)
      throw new DemoError("Use another owner to change your role.");
    put(
      state.tables.organization_memberships,
      { organization_id: org, user_id: account.id, role: input.role },
      ["organization_id", "user_id"],
    );
    auditDemo(state, user, org, "organization_memberships", {
      id: account.id,
      role: input.role,
    });
    return account.id;
  }
  if (name === "save_service" || name === "save_staff") {
    const service = name === "save_service";
    check(state, user, org, service ? "services:manage" : "staff:manage");
    const input = service ? serviceSchema.parse(data) : staffSchema.parse(data),
      table = service ? "services" : "staff_profiles";
    const id = input.id ?? crypto.randomUUID(),
      old = input.id ? structuredClone(scoped(state, table, org, id)) : null;
    if (!service) {
      const s = staffSchema.parse(data);
      if (
        s.user_id &&
        (!demoRole(state, s.user_id, org) ||
          state.tables.staff_profiles.some(
            (p) =>
              p.id !== id &&
              p.organization_id === org &&
              p.user_id === s.user_id,
          ))
      )
        throw new DemoError(
          "Account must be a salon member and linked to only one employee.",
        );
      s.service_ids.forEach((id) => scoped(state, "services", org, id));
      state.tables.staff_services = state.tables.staff_services.filter(
        (s) => s.staff_id !== id,
      );
      s.service_ids.forEach((service_id) =>
        state.tables.staff_services.push({
          organization_id: org,
          staff_id: id,
          service_id,
        }),
      );
    }
    const row = {
      ...input,
      id,
      organization_id: org,
      ...(!service ? { user_id: data.user_id || null } : {}),
    };
    put(state.tables[table], row);
    auditDemo(state, user, org, table, row, old);
    return id;
  }
  if (name === "set_compensation" || name === "set_service_commission") {
    check(state, user, org, "payroll:manage");
    const input =
      name === "set_compensation"
        ? compensationSchema.parse(data)
        : serviceCommissionSchema.parse({
            staff_id: args.p_staff,
            service_id: args.p_service,
            commission_type: args.p_type,
            commission_value: String(args.p_value),
          });
    scoped(state, "staff_profiles", org, input.staff_id);
    const override = "service_id" in input;
    if (override) scoped(state, "services", org, input.service_id);
    const table = override ? "service_commission_rules" : "staff_compensation";
    put(
      state.tables[table],
      { ...input, organization_id: org },
      override ? ["staff_id", "service_id"] : ["staff_id"],
    );
    auditDemo(state, user, org, table, { id: input.staff_id });
    return null;
  }
  if (name === "save_booking") {
    check(state, user, org, "appointments:manage");
    const start = z.iso.datetime({ offset: true }).parse(data.start_at);
    const input = bookingSchema.parse({
      ...data,
      start_at: toLocalInput(start),
    });
    const employee = scoped(state, "staff_profiles", org, input.staff_id);
    if (!employee.active) throw new DemoError("Employee is unavailable.");
    const id = input.id ?? crypto.randomUUID(),
      old = input.id
        ? structuredClone(scoped(state, "appointments", org, id))
        : null;
    if (old && !["scheduled", "checked_in"].includes(value(old, "status")))
      throw new DemoError(
        "Only scheduled or checked-in bookings can be edited.",
      );
    const previous = state.tables.appointment_services
      .filter((s) => s.appointment_id === id)
      .sort((a, b) => Number(a.position) - Number(b.position));
    const unchanged =
      JSON.stringify(previous.map((s) => s.service_id)) ===
      JSON.stringify(input.service_ids);
    const pay = state.tables.staff_compensation.find(
      (c) =>
        c.staff_id === input.staff_id &&
        value(c, "effective_from") <= businessDate(start),
    );
    const snapshots: DemoRow[] = input.service_ids.map(
      (service_id, position) => {
        const s = scoped(state, "services", org, service_id);
        if (!s.active) throw new DemoError("Service is unavailable.");
        const skills = state.tables.staff_services.filter(
          (s) => s.staff_id === input.staff_id,
        );
        if (skills.length && !skills.some((s) => s.service_id === service_id))
          throw new DemoError(
            "Employee is not qualified for a selected service.",
          );
        const rule =
          state.tables.service_commission_rules.find(
            (r) => r.staff_id === input.staff_id && r.service_id === service_id,
          ) ?? pay;
        const commission = {
          commission_type: rule?.commission_type ?? "none",
          commission_value: rule?.commission_value ?? "0",
        };
        if (unchanged)
          return {
            ...previous[position],
            ...(old?.staff_id !== input.staff_id ? commission : {}),
          };
        return {
          id: crypto.randomUUID(),
          organization_id: org,
          appointment_id: id,
          service_id,
          position,
          name_snapshot: s.name,
          price_php: s.price_php,
          duration_minutes: s.duration_minutes,
          buffer_minutes: s.buffer_minutes,
          ...commission,
        };
      },
    );
    const minutes = snapshots.reduce(
        (total, s) =>
          total + Number(s.duration_minutes) + Number(s.buffer_minutes),
        0,
      ),
      end = new Date(Date.parse(start) + minutes * 60000).toISOString();
    const settings = state.tables.salon_settings.find(
      (s) => s.organization_id === org,
    )!;
    const local = toLocalInput(start),
      localEnd = toLocalInput(end),
      day = new Date(`${local.slice(0, 10)}T00:00Z`).getUTCDay();
    const fits = (hours: unknown) => {
      const range = (hours as Record<string, string[] | null>)[day];
      return (
        range &&
        local.slice(11) >= range[0] &&
        localEnd.slice(11) <= range[1] &&
        local.slice(0, 10) === localEnd.slice(0, 10)
      );
    };
    if (
      !fits(settings.opening_hours) ||
      (settings.closed_dates as string[]).includes(businessDate(start))
    )
      throw new DemoError("Appointment is outside salon hours.");
    if (employee.working_hours && !fits(employee.working_hours))
      throw new DemoError("Employee is unavailable at that time.");
    if (Number(local.slice(14)) % Number(settings.slot_minutes) !== 0)
      throw new DemoError("Start time must follow the salon booking interval.");
    if (
      state.tables.appointments.some(
        (a) =>
          a.id !== id &&
          a.staff_id === input.staff_id &&
          !["cancelled", "no_show"].includes(value(a, "status")) &&
          overlaps(start, end, value(a, "start_at"), value(a, "end_at")),
      )
    )
      throw new DemoError(
        "This employee already has an appointment at that time.",
        "23P01",
      );
    const customer = input.customer_id
      ? scoped(state, "customers", org, input.customer_id)
      : null;
    const row = {
      ...input,
      id,
      organization_id: org,
      customer_id: input.customer_id || null,
      walk_in_name: customer?.name ?? (input.walk_in_name || "Walk-in"),
      start_at: start,
      end_at: end,
      status: old?.status ?? "scheduled",
      created_at: old?.created_at ?? now,
      updated_at: now,
      created_by: old?.created_by ?? user,
      updated_by: user,
    };
    put(state.tables.appointments, row);
    state.tables.appointment_services = state.tables.appointment_services
      .filter((s) => s.appointment_id !== id)
      .concat(snapshots);
    auditDemo(state, user, org, "appointments", row, old);
    return id;
  }
  if (name === "transition_booking") {
    check(state, user, org, "appointments:manage");
    const row = scoped(state, "appointments", org, String(args.p_id)),
      status = String(args.p_status);
    if (row.status === status) return null;
    if (
      !nextStatuses(row.status as Parameters<typeof nextStatuses>[0]).includes(
        status as Parameters<typeof nextStatuses>[0],
      )
    )
      throw new DemoError("Invalid appointment status transition.");
    const old = structuredClone(row);
    row.status = status;
    row.updated_at = now;
    if (status === "completed")
      for (const s of state.tables.appointment_services.filter(
        (s) => s.appointment_id === row.id,
      )) {
        if (
          state.tables.commission_earnings.some(
            (e) => e.appointment_service_id === s.id,
          )
        )
          continue;
        const amount =
          s.commission_type === "fixed"
            ? centavos(value(s, "commission_value"))
            : s.commission_type === "percent"
              ? rounded(
                  centavos(value(s, "price_php")) *
                    centavos(value(s, "commission_value")),
                  10000n,
                )
              : 0n;
        state.tables.commission_earnings.push({
          id: crypto.randomUUID(),
          organization_id: org,
          appointment_service_id: s.id,
          staff_id: row.staff_id,
          earned_at: now,
          amount_php: decimal(amount),
          rule_snapshot: {
            type: s.commission_type,
            value: s.commission_value,
            price: s.price_php,
          },
        });
      }
    auditDemo(state, user, org, "appointments", row, old);
    return null;
  }
  if (name === "punch_attendance") {
    check(state, user, org, "attendance:clock");
    const employee = state.tables.staff_profiles.find(
      (s) => s.organization_id === org && s.user_id === user && s.active,
    );
    if (!employee)
      throw new DemoError("Ask the owner to link an active employee profile.");
    const open = state.tables.attendance_entries.find(
      (a) => a.staff_id === employee.id && !a.clock_out_at,
    );
    if (args.p_direction === "in") {
      if (open) throw new DemoError("You are already clocked in.");
      const row = {
        id: crypto.randomUUID(),
        organization_id: org,
        staff_id: employee.id,
        clock_in_at: now,
        clock_out_at: null,
        break_minutes: 0,
        status: "open",
        correction_reason: null,
        approved_by: null,
        approved_at: null,
      };
      assertShift(state, row);
      state.tables.attendance_entries.push(row);
      auditDemo(state, user, org, "attendance_entries", row);
      return row.id;
    }
    if (args.p_direction !== "out" || !open)
      throw new DemoError("Clock in before clocking out.");
    const old = structuredClone(open);
    Object.assign(open, { clock_out_at: now, status: "submitted" });
    assertShift(state, open);
    auditDemo(state, user, org, "attendance_entries", open, old);
    return open.id;
  }
  if (name === "review_attendance") {
    check(state, user, org, "attendance:manage");
    const old = data.id
      ? structuredClone(
          scoped(state, "attendance_entries", org, String(data.id)),
        )
      : null;
    if (
      old &&
      state.tables.payroll_line_items.some((l) => l.attendance_id === old.id)
    )
      throw new DemoError(
        "Attendance is allocated to payroll; use a later adjustment.",
      );
    if (data.operation === "approve") {
      if (!old?.clock_out_at)
        throw new DemoError("Close the shift before approval.");
      const row: DemoRow = {
        ...old,
        status: "approved",
        approved_at: now,
        approved_by: user,
      };
      put(state.tables.attendance_entries, row);
      auditDemo(state, user, org, "attendance_entries", row, old);
      return row.id;
    }
    const input = correctionSchema.parse({
      ...data,
      clock_in_at: toLocalInput(String(data.clock_in_at)),
      clock_out_at: toLocalInput(String(data.clock_out_at)),
    });
    scoped(state, "staff_profiles", org, input.staff_id);
    const row = {
      ...input,
      id: old?.id ?? crypto.randomUUID(),
      organization_id: org,
      staff_id: old?.staff_id ?? input.staff_id,
      clock_in_at: data.clock_in_at,
      clock_out_at: data.clock_out_at,
      status: "corrected",
      approved_at: null,
      approved_by: null,
    };
    assertShift(state, row);
    put(state.tables.attendance_entries, row);
    auditDemo(state, user, org, "attendance_entries", row, old);
    return row.id;
  }
  if (name === "calculate_payroll") return calculate(state, user, org, args);
  if (name === "adjust_payroll") {
    check(state, user, org, "payroll:manage");
    const input = adjustmentSchema.parse({
      item_id: args.p_item,
      kind: args.p_kind,
      description: args.p_description,
      amount: String(args.p_amount),
    });
    const item = scoped(state, "payroll_items", org, input.item_id),
      period = mutablePeriod(state, org, value(item, "payroll_period_id")),
      amount = centavos(input.amount);
    state.tables.payroll_line_items.push({
      id: crypto.randomUUID(),
      organization_id: org,
      payroll_item_id: item.id,
      kind: input.kind,
      description: input.description,
      amount_php: decimal(amount),
      attendance_id: null,
      commission_id: null,
    });
    const field =
      input.kind === "deduction" ? "deductions_php" : "additions_php";
    item[field] = decimal(centavos(value(item, field)) + amount);
    item.net_php = decimal(
      centavos(value(item, "net_php")) +
        (input.kind === "deduction" ? -amount : amount),
    );
    period.status = "calculated";
    auditDemo(state, user, org, "payroll_items", item);
    return null;
  }
  if (name === "transition_payroll") {
    check(state, user, org, "payroll:manage");
    const input = payrollTransitionSchema.parse({
        id: args.p_id,
        status: args.p_status,
        reference: args.p_reference ?? "",
      }),
      period = scoped(state, "payroll_periods", org, input.id);
    if (period.status === input.status) return null;
    if (
      (
        {
          calculated: "reviewed",
          reviewed: "approved",
          approved: "paid",
        } as Record<string, string>
      )[value(period, "status")] !== input.status
    )
      throw new DemoError("Invalid payroll status transition.");
    if (
      input.status === "approved" &&
      state.tables.payroll_items.some(
        (i) =>
          i.payroll_period_id === period.id &&
          centavos(value(i, "net_php")) < 0n,
      )
    )
      throw new DemoError("Resolve negative net pay before approval.");
    const old = structuredClone(period);
    period.status = input.status;
    if (input.status === "approved")
      Object.assign(period, { approved_at: now, approved_by: user });
    if (input.status === "paid")
      Object.assign(period, {
        paid_at: now,
        paid_by: user,
        paid_reference: input.reference,
      });
    auditDemo(state, user, org, "payroll_periods", period, old);
    return null;
  }
  if (name === "log_payslip_access") {
    const item = visibleDemoRows(state, user, "payroll_items").find(
      (i) => i.id === args.p_item && i.organization_id === org,
    );
    if (
      !item ||
      !state.tables.payroll_periods.some(
        (p) =>
          p.id === item.payroll_period_id &&
          ["approved", "paid"].includes(value(p, "status")),
      )
    )
      throw new DemoError("Permission denied", "42501");
    auditDemo(state, user, org, "payroll_items", item, null, "payslip_access");
    return null;
  }
  throw new DemoError("This operation is unavailable in demo mode.");
}
function calculate(
  state: DemoState,
  user: string | null,
  org: string,
  args: DemoRow,
) {
  check(state, user, org, "payroll:manage");
  const input = periodSchema.parse({
    start_date: args.p_start,
    end_date: args.p_end,
  });
  const { start_date: start, end_date: end } = input;
  const existing = state.tables.payroll_periods.find(
    (p) =>
      p.organization_id === org && p.start_date === start && p.end_date === end,
  );
  if (existing) mutablePeriod(state, org, value(existing, "id"));
  if (
    state.tables.payroll_periods.some(
      (p) =>
        p.organization_id === org &&
        p.id !== existing?.id &&
        value(p, "start_date") <= end &&
        value(p, "end_date") >= start,
    )
  )
    throw new DemoError("This cutoff overlaps an existing payroll period.");
  const periodId = existing?.id ?? crypto.randomUUID(),
    itemIds = state.tables.payroll_items
      .filter((i) => i.payroll_period_id === periodId)
      .map((i) => i.id);
  if (
    state.tables.payroll_line_items.some(
      (l) =>
        itemIds.includes(l.payroll_item_id) &&
        ["allowance", "deduction", "adjustment"].includes(value(l, "kind")),
    )
  )
    throw new DemoError(
      "A preview with manual adjustments cannot be recalculated.",
    );
  state.tables.payroll_line_items = state.tables.payroll_line_items.filter(
    (l) => !itemIds.includes(l.payroll_item_id),
  );
  state.tables.payroll_items = state.tables.payroll_items.filter(
    (i) => i.payroll_period_id !== periodId,
  );
  const settings = state.tables.salon_settings.find(
    (s) => s.organization_id === org,
  )!;
  const inCutoff = (time: unknown) =>
    businessDate(String(time)) >= start && businessDate(String(time)) <= end;
  const people = state.tables.staff_profiles.filter(
    (s) =>
      s.organization_id === org &&
      ((s.active && value(s, "hire_date") <= end) ||
        state.tables.commission_earnings.some(
          (c) => c.staff_id === s.id && inCutoff(c.earned_at),
        ) ||
        state.tables.attendance_entries.some(
          (a) =>
            a.staff_id === s.id &&
            a.status === "approved" &&
            inCutoff(a.clock_in_at),
        )),
  );
  if (!people.length)
    throw new DemoError("Add employees before generating payroll.");
  for (const s of people) {
    const pay = state.tables.staff_compensation.find(
      (p) => p.staff_id === s.id && value(p, "effective_from") <= start,
    );
    if (!pay)
      throw new DemoError(
        "Every included employee needs compensation effective on or before cutoff start.",
      );
    const shifts = state.tables.attendance_entries.filter(
      (a) =>
        a.staff_id === s.id &&
        a.status === "approved" &&
        inCutoff(a.clock_in_at) &&
        !state.tables.payroll_line_items.some((l) => l.attendance_id === a.id),
    );
    const earnings = state.tables.commission_earnings.filter(
      (c) =>
        c.staff_id === s.id &&
        inCutoff(c.earned_at) &&
        !state.tables.payroll_line_items.some((l) => l.commission_id === c.id),
    );
    const milliseconds = shifts.reduce(
        (sum, a) =>
          sum +
          Date.parse(value(a, "clock_out_at")) -
          Date.parse(value(a, "clock_in_at")) -
          Number(a.break_minutes) * 60000,
        0,
      ),
      days = new Set(shifts.map((a) => businessDate(value(a, "clock_in_at"))))
        .size;
    const rate = centavos(value(pay, "rate_php"));
    const base =
      pay.pay_basis === "hourly"
        ? rounded(rate * BigInt(milliseconds), 3600000n)
        : pay.pay_basis === "daily"
          ? rate * BigInt(days)
          : rounded(rate * 100n, centavos(value(settings, "monthly_divisor")));
    const commission = earnings.reduce(
        (sum, e) => sum + centavos(value(e, "amount_php")),
        0n,
      ),
      item = crypto.randomUUID();
    state.tables.payroll_items.push({
      id: item,
      organization_id: org,
      payroll_period_id: periodId,
      staff_id: s.id,
      employee_name: s.display_name,
      basis_snapshot: {
        basis: pay.pay_basis,
        rate: pay.rate_php,
        monthly_divisor: settings.monthly_divisor,
        effective_from: pay.effective_from,
      },
      approved_minutes: (milliseconds / 60000).toFixed(2),
      approved_days: days,
      base_php: decimal(base),
      commissions_php: decimal(commission),
      additions_php: "0.00",
      deductions_php: "0.00",
      net_php: decimal(base + commission),
    });
    const line = (
      kind: string,
      description: string,
      amount_php: string,
      attendance_id: unknown = null,
      commission_id: unknown = null,
    ) =>
      state.tables.payroll_line_items.push({
        id: crypto.randomUUID(),
        organization_id: org,
        payroll_item_id: item,
        kind,
        description,
        amount_php,
        attendance_id,
        commission_id,
      });
    line(
      "base",
      pay.pay_basis === "hourly"
        ? `${(milliseconds / 3600000).toFixed(4)} approved hours × PHP ${pay.rate_php}`
        : pay.pay_basis === "daily"
          ? `${days} approved business dates × PHP ${pay.rate_php}`
          : `PHP ${pay.rate_php} monthly / ${settings.monthly_divisor} configured cutoffs`,
      decimal(base),
    );
    shifts.forEach((a) =>
      line(
        "attendance",
        `${businessDate(value(a, "clock_in_at"))} · ${((Date.parse(value(a, "clock_out_at")) - Date.parse(value(a, "clock_in_at"))) / 60000 - Number(a.break_minutes)).toFixed(2)} approved minutes · Asia/Manila`,
        "0.00",
        a.id,
      ),
    );
    earnings.forEach((e) => {
      const source = state.tables.appointment_services.find(
        (s) => s.id === e.appointment_service_id,
      )!;
      line(
        "commission",
        `${source.name_snapshot} · ${JSON.stringify(e.rule_snapshot)}`,
        value(e, "amount_php"),
        null,
        e.id,
      );
    });
  }
  const period = {
    ...(existing ?? {}),
    id: periodId,
    organization_id: org,
    ...input,
    status: "calculated",
    prepared_by: user,
    approved_at: null,
    paid_at: null,
    paid_reference: null,
  };
  put(state.tables.payroll_periods, period);
  auditDemo(
    state,
    user,
    org,
    "payroll_periods",
    period,
    existing ? structuredClone(existing) : null,
  );
  return periodId;
}
export function executeDemoRpc(
  state: DemoState,
  user: string | null,
  name: string,
  args: DemoRow,
): unknown {
  // A failed command never commits partial modifications to the JSON store.
  const draft = structuredClone(state),
    result = command(draft, user, name, args);
  state.tables = draft.tables;
  return result;
}
