import { describe, expect, it } from "vitest";
import {
  calendarDays,
  calendarKeyboardDate,
  isCalendarDate,
  shiftCalendarDay,
  shiftCalendarMonth,
} from "./calendar";

describe("calendar date controls", () => {
  it("rejects impossible dates instead of normalizing them", () => {
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDate("2026-02-29")).toBe(false);
    expect(isCalendarDate("2026-10-20T09:00")).toBe(false);
  });

  it("keeps calendar values independent of local device timezones", () => {
    expect(shiftCalendarDay("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftCalendarDay("2026-01-01", -1)).toBe("2025-12-31");
    const days = calendarDays("2026-10-20");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-09-27");
    expect(days[41]).toBe("2026-11-07");
    expect(new Set(days).size).toBe(42);
  });

  it("clamps month and year navigation at leap and month boundaries", () => {
    expect(shiftCalendarMonth("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftCalendarMonth("2024-01-31", 1)).toBe("2024-02-29");
    expect(shiftCalendarMonth("2024-02-29", 12)).toBe("2025-02-28");
    expect(shiftCalendarMonth("2026-01-31", -1)).toBe("2025-12-31");
  });

  it("supports day, week, month and year keyboard navigation", () => {
    expect(calendarKeyboardDate("2026-10-20", "ArrowRight")).toBe("2026-10-21");
    expect(calendarKeyboardDate("2026-10-20", "ArrowUp")).toBe("2026-10-13");
    expect(calendarKeyboardDate("2026-10-20", "Home")).toBe("2026-10-18");
    expect(calendarKeyboardDate("2026-10-20", "End")).toBe("2026-10-24");
    expect(calendarKeyboardDate("2026-10-31", "PageDown")).toBe("2026-11-30");
    expect(calendarKeyboardDate("2024-02-29", "PageDown", true)).toBe(
      "2025-02-28",
    );
    expect(calendarKeyboardDate("2026-10-20", "Tab")).toBeNull();
  });
});
