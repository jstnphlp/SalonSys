import { describe, it, expect } from "vitest";
import {
  businessDate,
  toUtc,
  toLocalInput,
  estimateEnd,
  payableMinutes,
  centavos,
  decimal,
} from "./domain";
import { localTime, hoursSchema, money } from "./schemas";
import { bookingSchema } from "@/features/appointments/schemas";
import { nextStatuses, overlaps } from "@/features/appointments/domain";
import { correctionSchema } from "@/features/attendance/schemas";
import {
  periodSchema,
  adjustmentSchema,
  payrollTransitionSchema,
} from "@/features/payroll/schemas";
const id = "10000000-0000-4000-8000-000000000001";
describe("Manila business time and exact monetary display", () => {
  it("converts UTC boundaries and estimates a 75 minute nail service", () => {
    expect(businessDate("2026-10-19T16:00:00Z")).toBe("2026-10-20");
    expect(toUtc("2026-10-20T14:00")).toBe("2026-10-20T06:00:00.000Z");
    expect(toLocalInput("2026-10-20T06:00:00Z")).toBe("2026-10-20T14:00");
    expect(toLocalInput(estimateEnd("2026-10-20T14:00", 75))).toBe(
      "2026-10-20T15:15",
    );
  });
  it("counts overnight minutes after approved breaks", () =>
    expect(
      payableMinutes("2026-10-20T15:00:00Z", "2026-10-21T01:00:00Z", 60),
    ).toBe(540));
  it("adds decimals without binary floating point", () => {
    expect(decimal(centavos("0.10") + centavos("0.20"))).toBe("0.30");
    expect(decimal(centavos("100.00") + centavos("-12.05"))).toBe("87.95");
    expect(money.safeParse("12.345").success).toBe(false);
  });
});
describe("salon workflow validation", () => {
  it("rejects impossible dates and invalid opening hours", () => {
    expect(localTime.safeParse("2026-02-30T09:00").success).toBe(false);
    expect(localTime.safeParse("2026-10-20T25:00").success).toBe(false);
    expect(hoursSchema.safeParse({}).success).toBe(false);
    expect(
      hoursSchema.safeParse(
        Object.fromEntries(
          Array.from({ length: 7 }, (_, i) => [i, ["18:00", "09:00"]]),
        ),
      ).success,
    ).toBe(false);
  });
  it("rejects duplicate service selections", () =>
    expect(
      bookingSchema.safeParse({
        staff_id: id,
        customer_id: "",
        walk_in_name: "",
        start_at: "2026-10-20T09:00",
        notes: "",
        service_ids: [id, id],
      }).success,
    ).toBe(false));
  it("allows adjacent appointments and freezes terminal booking states", () => {
    expect(
      overlaps(
        "2026-10-20T01:00Z",
        "2026-10-20T02:00Z",
        "2026-10-20T02:00Z",
        "2026-10-20T03:00Z",
      ),
    ).toBe(false);
    expect(nextStatuses("completed")).toEqual([]);
  });
  it("requires a correction reason and rejects breaks longer than the shift", () => {
    const input = {
      staff_id: id,
      clock_in_at: "2026-10-20T23:00",
      clock_out_at: "2026-10-21T01:00",
      break_minutes: 30,
      correction_reason: "Missed punch",
    };
    expect(correctionSchema.safeParse(input).success).toBe(true);
    expect(
      correctionSchema.safeParse({ ...input, break_minutes: 121 }).success,
    ).toBe(false);
    expect(
      correctionSchema.safeParse({ ...input, correction_reason: "" }).success,
    ).toBe(false);
  });
  it("validates cutoffs, documented deductions and payment references", () => {
    expect(
      periodSchema.safeParse({
        start_date: "2026-10-16",
        end_date: "2026-10-01",
      }).success,
    ).toBe(false);
    expect(
      adjustmentSchema.safeParse({
        item_id: id,
        kind: "deduction",
        description: "Reviewed deduction",
        amount: "-25.00",
      }).success,
    ).toBe(false);
    expect(
      payrollTransitionSchema.safeParse({ id, status: "paid", reference: "" })
        .success,
    ).toBe(false);
  });
});
