"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "./form-message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions/result";
import { validationMessage } from "@/lib/validation-message";
import { useToastManager } from "./app-toasts";

export type Field = {
  name: string;
  label: string;
  kind?:
    | "text"
    | "number"
    | "date"
    | "datetime-local"
    | "email"
    | "password"
    | "checkbox"
    | "select"
    | "multiple"
    | "cards"
    | "textarea"
    | "hours"
    | "dates";
  options?: {
    value: string;
    label: string;
    description?: string;
    detail?: string;
  }[];
  hint?: string;
  step?: string;
};
export type RecordFormProps = {
  schema: z.ZodType<Record<string, unknown>, Record<string, unknown>>;
  defaults: Record<string, unknown>;
  fields: Field[];
  action: (input: unknown) => Promise<ActionResult<unknown>>;
  submitLabel?: string;
  onSuccess?: (result: unknown) => void;
  preview?: (values: Record<string, unknown>) => ReactNode;
};
export function RecordForm({
  schema,
  defaults,
  fields,
  action,
  submitLabel = "Save changes",
  onSuccess,
  preview,
}: RecordFormProps) {
  const router = useRouter();
  const toasts = useToastManager();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{
    status: "success" | "error";
    text: string;
  }>();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const values = useWatch({ control });
  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((input) =>
        start(async () => {
          setMessage(undefined);
          const result = await action(input);
          if (result.status === "error") {
            setMessage({ status: "error", text: result.message });
            for (const [field, messages] of Object.entries(
              result.fieldErrors ?? {},
            ))
              setError(field, { message: messages.join(" ") });
          }
          if (result.status === "success") {
            toasts.add({ title: result.message });
            router.refresh();
            onSuccess?.(result.data);
          }
        }),
      )}
      noValidate
    >
      {message && (
        <FormMessage status={message.status}>{message.text}</FormMessage>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `field-${field.name}`;
          const fieldValue = values[field.name];
          const error = errors[field.name]
            ? validationMessage(errors[field.name]?.message, field.label)
            : undefined;
          return (
            <div
              className={
                field.kind === "hours" ||
                field.kind === "textarea" ||
                field.kind === "multiple" ||
                field.kind === "cards"
                  ? "space-y-2 sm:col-span-2"
                  : "space-y-2"
              }
              key={field.name}
            >
              {field.kind === "cards" ? (
                <div className="flex items-center justify-between gap-2">
                  <span id={`${id}-label`} className="text-sm font-medium">
                    {field.label}
                  </span>
                  <span
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {Array.isArray(fieldValue) ? fieldValue.length : 0} selected
                  </span>
                </div>
              ) : (
                <label htmlFor={id} className="text-sm font-medium">
                  {field.label}
                </label>
              )}
              {field.kind === "hours" ? (
                <HoursEditor
                  value={
                    values[field.name] as Record<
                      string,
                      [string, string] | null
                    > | null
                  }
                  onChange={(v) =>
                    setValue(field.name, v, { shouldValidate: true })
                  }
                  id={id}
                />
              ) : field.kind === "checkbox" ? (
                <input
                  className="ml-3 size-5 accent-primary"
                  id={id}
                  type="checkbox"
                  {...register(field.name)}
                />
              ) : field.kind === "cards" ? (
                <fieldset
                  id={id}
                  aria-labelledby={`${id}-label`}
                  aria-describedby={
                    [field.hint && `${id}-hint`, error && `${id}-error`]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  aria-invalid={!!error}
                  className="grid max-h-64 gap-2 overflow-y-auto rounded-xl p-1 sm:grid-cols-2"
                >
                  {field.options?.length ? (
                    field.options.map((option) => (
                      <label
                        key={option.value}
                        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/60 has-checked:border-primary/60 has-checked:bg-accent/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/40"
                      >
                        <input
                          type="checkbox"
                          value={option.value}
                          aria-label={option.label}
                          aria-invalid={!!error}
                          aria-describedby={error ? `${id}-error` : undefined}
                          className="peer sr-only"
                          {...register(field.name)}
                        />
                        <span
                          aria-hidden="true"
                          className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-[5px] border border-input bg-background text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] leading-5 font-medium group-has-checked:text-accent-foreground">
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                          {option.detail && (
                            <span className="mt-2 block text-xs font-semibold text-primary">
                              {option.detail}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">
                      No options available.
                    </p>
                  )}
                </fieldset>
              ) : field.kind === "select" || field.kind === "multiple" ? (
                <Select
                  id={id}
                  multiple={field.kind === "multiple"}
                  className={field.kind === "multiple" ? "h-32" : ""}
                  {...register(field.name)}
                  aria-invalid={!!error}
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : field.kind === "textarea" ? (
                <Textarea
                  id={id}
                  {...register(field.name)}
                  aria-invalid={!!error}
                />
              ) : field.kind === "dates" ? (
                <Input
                  id={id}
                  defaultValue={(defaults[field.name] as string[]).join(", ")}
                  {...register(field.name, {
                    setValueAs: (v) =>
                      typeof v === "string"
                        ? v
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : v,
                  })}
                  aria-invalid={!!error}
                />
              ) : (
                <Input
                  id={id}
                  type={field.kind ?? "text"}
                  step={field.step}
                  {...register(
                    field.name,
                    field.kind === "number" ? { valueAsNumber: true } : {},
                  )}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
              )}
              {field.hint && (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                  {field.hint}
                </p>
              )}
              {error && (
                <p id={`${id}-error`} className="text-xs text-destructive">
                  {String(error)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(errors).some((k) => !fields.some((f) => f.name === k)) && (
        <FormMessage status="error">
          {Object.entries(errors)
            .filter(([k]) => !fields.some((f) => f.name === k))
            .map(([, v]) => validationMessage(v?.message, "your entries"))
            .join(" ")}
        </FormMessage>
      )}
      {preview?.(values)}
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
function HoursEditor({
  value,
  onChange,
  id,
}: {
  value: Record<string, [string, string] | null> | null;
  onChange: (v: Record<string, [string, string] | null> | null) => void;
  id: string;
}) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return (
    <fieldset id={id} className="space-y-2 rounded-xl border p-3">
      <legend className="sr-only">Weekly hours</legend>
      {value === null ? (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onChange(
              Object.fromEntries(days.map((_, i) => [i, ["09:00", "18:00"]])),
            )
          }
        >
          Set custom weekly hours
        </Button>
      ) : (
        <>
          {days.map((day, i) => (
            <div
              key={day}
              className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-2 text-xs"
            >
              <label className="flex items-center gap-1">
                <input
                  aria-label={`${day} open`}
                  type="checkbox"
                  checked={!!value[i]}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      [i]: e.target.checked ? ["09:00", "18:00"] : null,
                    })
                  }
                />
                {day.slice(0, 3)}
              </label>
              {value[i] ? (
                <>
                  <Input
                    type="time"
                    aria-label={`${day} opening`}
                    value={value[i]![0]}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        [i]: [e.target.value, value[i]![1]],
                      })
                    }
                  />
                  <Input
                    type="time"
                    aria-label={`${day} closing`}
                    value={value[i]![1]}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        [i]: [value[i]![0], e.target.value],
                      })
                    }
                  />
                </>
              ) : (
                <span className="col-span-2 text-muted-foreground">
                  Closed / unavailable
                </span>
              )}
            </div>
          ))}
        </>
      )}
    </fieldset>
  );
}
export function RecordDialog({
  title,
  description,
  triggerLabel = "Edit",
  triggerVariant = "outline",
  ...props
}: RecordFormProps & {
  title: string;
  description: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <RecordForm
          {...props}
          onSuccess={(v) => {
            setOpen(false);
            props.onSuccess?.(v);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
