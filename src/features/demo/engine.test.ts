import { describe, expect, it, afterEach, vi } from "vitest";
import { createDemoSeed, demoId } from "./seed";
import { executeDemoRpc, visibleDemoRows } from "./engine";
import { businessDate, addDays, toUtc } from "@/features/salon/domain";
import {
  appointmentRowSchema,
  bookingServiceRowSchema,
} from "@/features/appointments/schemas";
import { attendanceRowSchema } from "@/features/attendance/schemas";
import {
  itemRowSchema,
  lineRowSchema,
  periodRowSchema,
} from "@/features/payroll/schemas";
import { settingsRowSchema } from "@/features/salon/schemas";
import { serviceRowSchema } from "@/features/services/schemas";
import { staffRowSchema } from "@/features/staff/schemas";
import { isDemoMode } from "@/config/demo";
const owner = demoId(0, 1),
  staff = demoId(0, 3),
  org = demoId(1, 1);
afterEach(() => vi.unstubAllEnvs());
describe("explicit database-free demo mode", () => {
  it("never falls back to demo access when production credentials are absent", () => {
    vi.stubEnv("SALONSYS_DEMO_MODE", "");
    expect(isDemoMode()).toBe(false);
    vi.stubEnv("SALONSYS_DEMO_MODE", "true");
    expect(isDemoMode()).toBe(true);
  });
  it("seeds both salons with data matching the existing screens' read contracts", () => {
    const state = createDemoSeed();
    const schemas = {
      settings: settingsRowSchema,
      services: serviceRowSchema.array(),
      staff: staffRowSchema.array(),
      appointments: appointmentRowSchema.array(),
      booking_services: bookingServiceRowSchema.array(),
      attendance: attendanceRowSchema.array(),
      periods: periodRowSchema.array(),
      payroll_items: itemRowSchema.array(),
      payroll_lines: lineRowSchema.array(),
    };
    for (const [user, salon] of [
      [owner, org],
      [demoId(0, 4), demoId(1, 2)],
    ])
      for (const [resource, schema] of Object.entries(schemas))
        expect(
          schema.safeParse(
            executeDemoRpc(state, user, "salon_read", {
              p_org: salon,
              p_resource: resource,
            }),
          ).success,
          resource,
        ).toBe(true);
  });
  it("keeps tenants and other employees' compensation private when switching identities", () => {
    const state = createDemoSeed();
    expect(
      visibleDemoRows(state, owner, "services").every(
        (s) => s.organization_id === org,
      ),
    ).toBe(true);
    expect(visibleDemoRows(state, staff, "staff_compensation")).toEqual([]);
    expect(visibleDemoRows(state, staff, "payroll_items")).toHaveLength(1);
    expect(visibleDemoRows(state, staff, "payroll_items")[0].staff_id).toBe(
      demoId(4, 1),
    );
    expect(() =>
      executeDemoRpc(state, demoId(0, 2), "calculate_payroll", {
        p_org: org,
        p_start: businessDate(),
        p_end: businessDate(),
      }),
    ).toThrow("Permission denied");
    expect(() =>
      executeDemoRpc(state, owner, "salon_read", {
        p_org: demoId(1, 2),
        p_resource: "services",
      }),
    ).toThrow("Permission denied");
  });
  it("supports booking through frozen payroll without a SQL engine", () => {
    const state = createDemoSeed(),
      today = businessDate();
    const rpc = (name: string, args: Record<string, unknown>) =>
      executeDemoRpc(state, owner, name, { p_org: org, ...args });
    const input = {
      staff_id: demoId(4, 1),
      customer_id: "",
      walk_in_name: "Demo walk-in",
      start_at: toUtc(`${today}T16:00`),
      service_ids: [demoId(3, 1)],
      notes: "",
    };
    const booking = rpc("save_booking", { p_data: input });
    const before = structuredClone(state);
    expect(() => rpc("save_booking", { p_data: input })).toThrow(
      "already has an appointment",
    );
    expect(state).toEqual(before);
    state.tables.services.find((s) => s.id === demoId(3, 1))!.price_php =
      "999.00";
    for (const status of ["checked_in", "in_service", "completed", "completed"])
      rpc("transition_booking", { p_id: booking, p_status: status });
    expect(
      state.tables.commission_earnings.filter(
        (e) =>
          e.appointment_service_id ===
          state.tables.appointment_services.find(
            (s) => s.appointment_id === booking,
          )?.id,
      ),
    ).toHaveLength(1);
    expect(
      state.tables.appointment_services.find(
        (s) => s.appointment_id === booking,
      )!.price_php,
    ).toBe("350.00");
    const previous = addDays(today, -2),
      yesterday = addDays(today, -1);
    const shift = rpc("review_attendance", {
      p_data: {
        operation: "correct",
        staff_id: demoId(4, 1),
        clock_in_at: toUtc(`${previous}T23:00`),
        clock_out_at: toUtc(`${yesterday}T08:00`),
        break_minutes: 60,
        correction_reason: "Missed overnight punch",
      },
    });
    rpc("review_attendance", { p_data: { id: shift, operation: "approve" } });
    const period = rpc("calculate_payroll", {
      p_start: previous,
      p_end: today,
    });
    const item = state.tables.payroll_items.find(
      (i) => i.payroll_period_id === period && i.staff_id === demoId(4, 1),
    )!;
    expect(item.base_php).toBe("1600.00");
    expect(item.commissions_php).toBe("70.00");
    expect(item.net_php).toBe("1670.00");
    rpc("adjust_payroll", {
      p_item: item.id,
      p_kind: "deduction",
      p_description: "Reviewed sample deduction",
      p_amount: 25,
    });
    expect(
      state.tables.payroll_items.find((i) => i.id === item.id)!.net_php,
    ).toBe("1645.00");
    for (const status of ["reviewed", "approved", "paid", "paid"])
      rpc("transition_payroll", {
        p_id: period,
        p_status: status,
        p_reference: "Demo bank TEST-1",
      });
    expect(() =>
      rpc("calculate_payroll", { p_start: previous, p_end: today }),
    ).toThrow("immutable");
    expect(() =>
      rpc("review_attendance", { p_data: { id: shift, operation: "approve" } }),
    ).toThrow("allocated");
    expect(
      visibleDemoRows(state, staff, "payroll_items").filter(
        (i) => i.payroll_period_id === period,
      ),
    ).toHaveLength(1);
  });
  it("prevents duplicate punches and records a server-timed shift", () => {
    const state = createDemoSeed();
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
    try {
      executeDemoRpc(state, staff, "punch_attendance", {
        p_org: org,
        p_direction: "in",
      });
      expect(() =>
        executeDemoRpc(state, staff, "punch_attendance", {
          p_org: org,
          p_direction: "in",
        }),
      ).toThrow("already clocked in");
      vi.advanceTimersByTime(60000);
      executeDemoRpc(state, staff, "punch_attendance", {
        p_org: org,
        p_direction: "out",
      });
      expect(
        state.tables.attendance_entries.filter(
          (a) => a.staff_id === demoId(4, 1) && a.status === "submitted",
        ),
      ).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
