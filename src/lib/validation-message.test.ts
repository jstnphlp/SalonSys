import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validationMessage } from "./validation-message";
import { validationError } from "./actions/result";
import { serviceSchema } from "@/features/services/schemas";

describe("user-facing form validation", () => {
  it("gives actionable service field errors on the server", () => {
    const result = serviceSchema.safeParse({
      name: " ",
      category: "",
      price_php: "0.00",
      duration_minutes: 0,
      buffer_minutes: -1,
      active: true,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(validationError(result.error)).toMatchObject({
      status: "error",
      fieldErrors: {
        name: ["Enter a service name."],
        category: ["Enter a category."],
        duration_minutes: ["Services must last at least 5 minutes."],
        buffer_minutes: ["Cleanup time cannot be negative."],
      },
    });
  });

  it("replaces default schema diagnostics in client and server fallbacks", () => {
    const result = z
      .object({ name: z.string().min(1), duration: z.number().min(5) })
      .safeParse({ name: "", duration: 0 });
    if (result.success) throw new Error("Expected invalid input");
    const response = validationError(result.error);
    expect(JSON.stringify(response)).not.toMatch(
      /Too small|expected string|expected number/,
    );
    expect(
      validationMessage(result.error.issues[0].message, "Employee name"),
    ).toBe("Employee name is required.");
    expect(validationMessage(undefined, "Category")).toBe(
      "Check category and try again.",
    );
  });

  it("preserves specific guidance and domain validation messages", () => {
    expect(
      validationMessage(
        "Choose an inclusive cutoff of 1 to 63 days.",
        "Cutoff",
      ),
    ).toBe("Choose an inclusive cutoff of 1 to 63 days.");
  });
});
