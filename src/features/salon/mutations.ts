import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AuthorizationError,
  requirePermission,
} from "@/features/auth/authorization";
import type { Permission } from "@/features/auth/permissions";
import { requireSalon } from "./queries";
import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  actionSuccess,
  validationError,
  type ActionResult,
} from "@/lib/actions/result";

export async function salonMutation<T>(
  input: unknown,
  schema: z.ZodType<T>,
  permission: Permission,
  run: (
    db: Awaited<ReturnType<typeof createClient>>,
    org: string,
    value: T,
  ) => PromiseLike<{
    error: { message: string; code?: string } | null;
    data: unknown;
  }>,
  message = "Changes saved.",
): Promise<ActionResult<unknown>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const salon = await requireSalon();
    await requirePermission(permission, salon.id);
    const response = await run(await createClient(), salon.id, parsed.data);
    if (response.error) {
      const safe =
        response.error.code === "23P01"
          ? "This employee already has an appointment at that time."
          : response.error.code === "23505"
            ? "This record already exists. Refresh and try again."
            : response.error.code === "23503"
              ? "A selected record does not belong to this salon or is no longer available."
              : response.error.code === "P0001" &&
                  /^(The demo is full|Appointment is outside|Employee is unavailable|Employee is not qualified|You are already clocked|Clock in before|Only scheduled|Invalid .* transition|Attendance is allocated|Close the shift|This cutoff overlaps|This shift overlaps|Start time must|Finalized payroll|Every included employee|A preview with manual|Resolve negative|Account not found|Account must|Use another owner|Add employees)/.test(
                    response.error.message,
                  )
                ? response.error.message
                : "The change could not be saved. Check the selected records and try again.";
      return actionError(safe);
    }
    revalidatePath("/", "layout");
    return actionSuccess(message, response.data);
  } catch (error) {
    return actionError(
      error instanceof AuthorizationError
        ? error.message
        : "The change could not be saved. Try again.",
    );
  }
}
