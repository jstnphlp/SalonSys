import { z } from "zod";
import { php } from "@/features/salon/domain";
import type { PayrollLine } from "./schemas";

const decimalSnapshot = z.coerce.string().regex(/^\d{1,10}(\.\d{1,2})?$/);
const commissionSnapshot = z.object({
  type: z.enum(["percent", "fixed", "none"]),
  value: decimalSnapshot,
  price: decimalSnapshot,
});

// Existing payroll snapshots contain the rule after the service name. Format
// those immutable records at display time for both reviews and printed payslips.
export function presentPayrollLine(
  line: Pick<PayrollLine, "kind" | "description">,
) {
  if (line.kind !== "commission")
    return { title: line.description, detail: null };

  const parts = line.description.match(/^(.*?)(?:\s+·\s+|;\s*)(\{[\s\S]*)$/);
  const rawRule =
    parts?.[2] ??
    (line.description.trim().startsWith("{") ? line.description : null);
  if (!rawRule) return { title: line.description, detail: null };

  const title = parts?.[1]?.trim() || "Service commission";
  try {
    const result = commissionSnapshot.safeParse(JSON.parse(rawRule));
    if (result.success) {
      const rule = result.data;
      return {
        title,
        detail:
          rule.type === "percent"
            ? `${Number(rule.value)}% of ${php(rule.price)} service price`
            : rule.type === "fixed"
              ? `${php(rule.value)} fixed commission`
              : "No commission for this service",
      };
    }
  } catch {
    // Unrecognized historical data must not be presented as a valid formula.
  }
  return {
    title,
    detail: "Commission details unavailable. Review the source record.",
  };
}

export const payrollLineLabels: Record<PayrollLine["kind"], string> = {
  base: "Base pay",
  attendance: "Approved attendance",
  commission: "Service commission",
  allowance: "Allowance / extra pay",
  adjustment: "Adjustment",
  deduction: "Deduction",
};
