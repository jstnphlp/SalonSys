import { describe, expect, it } from "vitest";
import { php } from "@/features/salon/domain";
import { presentPayrollLine } from "./presentation";

describe("payroll commission presentation", () => {
  it.each([" · ", "; "])(
    "formats existing %s snapshots without changing stored calculations",
    (separator) => {
      expect(
        presentPayrollLine({
          kind: "commission",
          description: `Haircut & finish${separator}{"type":"percent","value":"10.00","price":"350.00"}`,
        }),
      ).toEqual({
        title: "Haircut & finish",
        detail: `10% of ${php("350.00")} service price`,
      });
    },
  );

  it("preserves fractional percentages and numeric snapshots", () => {
    expect(
      presentPayrollLine({
        kind: "commission",
        description:
          'Gel manicure; {"type":"percent","value":12.5,"price":650}',
      }).detail,
    ).toBe(`12.5% of ${php("650")} service price`);
  });

  it("distinguishes fixed amounts from percentages", () => {
    expect(
      presentPayrollLine({
        kind: "commission",
        description:
          'Nail art · {"type":"fixed","value":"50.00","price":"300.00"}',
      }).detail,
    ).toBe(`${php("50.00")} fixed commission`);
  });

  it.each([
    '{"type":"percent","value":"invalid","price":"350.00"}',
    '{"type":"unknown","value":10,"price":350}',
    "{broken json",
  ])(
    "handles invalid historical rules without showing JSON or inventing a formula",
    (rule) => {
      expect(
        presentPayrollLine({
          kind: "commission",
          description: `Haircut & finish · ${rule}`,
        }),
      ).toEqual({
        title: "Haircut & finish",
        detail: "Commission details unavailable. Review the source record.",
      });
    },
  );

  it("preserves manual descriptions and other financial line items", () => {
    expect(
      presentPayrollLine({
        kind: "commission",
        description: "Completed-service commission",
      }),
    ).toEqual({
      title: "Completed-service commission",
      detail: null,
    });
    expect(
      presentPayrollLine({
        kind: "adjustment",
        description: "Correction {reviewed}",
      }),
    ).toEqual({
      title: "Correction {reviewed}",
      detail: null,
    });
  });
});
