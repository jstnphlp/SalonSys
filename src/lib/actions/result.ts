import type { ZodError } from "zod";
import { validationMessage } from "@/lib/validation-message";

export type ActionResult<T = undefined> =
  | { status: "success"; message: string; data: T }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export function actionSuccess<T>(message: string, data: T): ActionResult<T> {
  return { status: "success", message, data };
}

export function actionError(message: string): ActionResult<never> {
  return { status: "error", message };
}

export function validationError(error: ZodError): ActionResult<never> {
  const flattened = error.flatten();

  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: Object.fromEntries(
      Object.entries(flattened.fieldErrors).map(([field, messages]) => [
        field,
        Array.isArray(messages)
          ? messages.map((message: unknown) =>
              validationMessage(message, field.replaceAll("_", " ")),
            )
          : [],
      ]),
    ),
  };
}
