"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useId, useRef, useState, type ComponentProps } from "react";
import { businessDate } from "@/features/salon/domain";
import {
  calendarDate,
  calendarDays,
  calendarKeyboardDate,
  isCalendarDate,
  shiftCalendarMonth,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Select } from "./select";

type DatePickerProps = Pick<
  ComponentProps<"input">,
  | "id"
  | "name"
  | "disabled"
  | "className"
  | "onBlur"
  | "ref"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-invalid"
> & { value: string; onValueChange: (value: string) => void; label: string };

export function DatePicker({
  value,
  onValueChange,
  label,
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{
    original: string;
    text: string;
  } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full min-w-0", className)}>
        <Input
          {...props}
          aria-label={props["aria-label"] ?? label}
          type="text"
          placeholder="YYYY-MM-DD"
          value={editing?.original === value ? editing.text : value}
          onChange={(event) => {
            setEditing({ original: value, text: event.target.value });
            onValueChange(event.target.value);
          }}
          className="pr-10 tabular-nums"
        />
        <Popover.Trigger
          disabled={props.disabled}
          aria-label={`Open ${label} calendar`}
          className="absolute top-1 right-1 grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-primary focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <CalendarDays className="size-4" />
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={8}
          align="start"
          className="z-[110] outline-none"
        >
          <Popover.Popup
            ref={calendarRef}
            initialFocus={() =>
              calendarRef.current?.querySelector<HTMLElement>(
                '[data-calendar-day][tabindex="0"]',
              ) ?? true
            }
            className="w-[296px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl transition-opacity outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <Popover.Title className="sr-only">{label}</Popover.Title>
            <Popover.Description className="sr-only">
              Choose a date. Use arrow keys to move between days and Page Up or
              Page Down to change months.
            </Popover.Description>
            <Calendar
              value={value}
              onSelect={(next) => {
                setEditing(null);
                onValueChange(next);
                setOpen(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Calendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const today = businessDate();
  const initial = isCalendarDate(value) ? value : today;
  const [month, setMonth] = useState(initial.slice(0, 7));
  const [focusDate, setFocusDate] = useState(initial);
  const gridRef = useRef<HTMLTableElement>(null);
  const titleId = useId();
  const selectedMonth = Number(month.slice(5)) - 1;
  const selectedYear = Number(month.slice(0, 4));
  const days = calendarDays(`${month}-01`);
  const heading = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(calendarDate(`${month}-01`));
  const changeMonth = (next: string) => {
    setMonth(next.slice(0, 7));
    setFocusDate(`${next.slice(0, 7)}-01`);
  };
  return (
    <>
      <div className="mb-3 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => changeMonth(shiftCalendarMonth(`${month}-01`, -1))}
        >
          <ChevronLeft />
        </Button>
        <Select
          aria-label="Calendar month"
          className="h-8 min-w-0 flex-1 border-transparent px-2 text-xs shadow-none"
          value={String(selectedMonth)}
          onValueChange={(next) =>
            changeMonth(
              `${selectedYear}-${String(Number(next) + 1).padStart(2, "0")}-01`,
            )
          }
          options={Array.from({ length: 12 }, (_, i) => ({
            value: String(i),
            label: new Intl.DateTimeFormat("en-PH", {
              month: "long",
              timeZone: "UTC",
            }).format(new Date(Date.UTC(2026, i, 1))),
          }))}
        />
        <Select
          aria-label="Calendar year"
          className="h-8 w-[78px] border-transparent px-2 text-xs shadow-none"
          value={String(selectedYear)}
          onValueChange={(next) =>
            changeMonth(
              `${next}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
            )
          }
          options={Array.from({ length: 201 }, (_, i) => selectedYear - 100 + i)
            .filter((year) => year >= 1 && year <= 9999)
            .map((year) => ({ value: String(year), label: String(year) }))}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => changeMonth(shiftCalendarMonth(`${month}-01`, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
      <span id={titleId} className="sr-only" aria-live="polite">
        {heading}
      </span>
      <table
        ref={gridRef}
        role="grid"
        aria-labelledby={titleId}
        className="w-full table-fixed border-separate border-spacing-0.5 text-center text-xs"
      >
        <thead>
          <tr>
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <th
                key={day}
                scope="col"
                className="h-8 font-medium text-muted-foreground"
              >
                <span aria-label={day}>{day.slice(0, 2)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day) => (
                <td
                  key={day}
                  role="gridcell"
                  aria-selected={day === value}
                  className="p-0"
                >
                  <button
                    type="button"
                    data-calendar-day={day}
                    tabIndex={day === focusDate ? 0 : -1}
                    aria-label={new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "full",
                      timeZone: "UTC",
                    }).format(calendarDate(day))}
                    aria-current={day === today ? "date" : undefined}
                    onClick={() => onSelect(day)}
                    onFocus={() => setFocusDate(day)}
                    onKeyDown={(event) => {
                      const next = calendarKeyboardDate(
                        day,
                        event.key,
                        event.shiftKey,
                      );
                      if (!next) return;
                      event.preventDefault();
                      setFocusDate(next);
                      setMonth(next.slice(0, 7));
                      requestAnimationFrame(() =>
                        gridRef.current
                          ?.querySelector<HTMLButtonElement>(
                            `[data-calendar-day="${next}"]`,
                          )
                          ?.focus(),
                      );
                    }}
                    className={cn(
                      "grid h-9 w-full place-items-center rounded-lg transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      day === value
                        ? "bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        : day.slice(0, 7) !== month
                          ? "text-muted-foreground/60"
                          : "text-foreground",
                      day === today &&
                        day !== value &&
                        "bg-accent font-semibold text-primary",
                    )}
                  >
                    {Number(day.slice(-2))}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onSelect(today)}
        >
          Today
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!value}
          onClick={() => onSelect("")}
        >
          Clear
        </Button>
      </div>
    </>
  );
}

export function TimePicker({
  value,
  onValueChange,
  label,
  disabled,
  invalid,
  describedBy,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const hour = valid ? Number(value.slice(0, 2)) : 9;
  const minute = valid ? value.slice(3, 5) : "00";
  const period = hour >= 12 ? "PM" : "AM";
  const change = (nextHour: number, nextMinute: string, nextPeriod: string) =>
    onValueChange(
      `${String((nextHour % 12) + (nextPeriod === "PM" ? 12 : 0)).padStart(2, "0")}:${nextMinute}`,
    );
  return (
    <div
      className="flex min-w-0 items-center gap-1"
      role="group"
      aria-label={label}
    >
      <Select
        aria-label={`${label} hour`}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={disabled}
        className="min-w-0 flex-1 px-2"
        placeholder="Hr"
        value={valid ? String(hour % 12 || 12) : ""}
        onValueChange={(next) => change(Number(next), minute, period)}
        options={Array.from({ length: 12 }, (_, i) => ({
          value: String(i + 1),
          label: String(i + 1).padStart(2, "0"),
        }))}
      />
      <span aria-hidden="true" className="text-muted-foreground">
        :
      </span>
      <Select
        aria-label={`${label} minute`}
        aria-invalid={invalid}
        disabled={disabled}
        className="min-w-0 flex-1 px-2"
        placeholder="Min"
        value={valid ? minute : ""}
        onValueChange={(next) => change(hour, next, period)}
        options={Array.from({ length: 60 }, (_, i) => ({
          value: String(i).padStart(2, "0"),
          label: String(i).padStart(2, "0"),
        }))}
      />
      <Select
        aria-label={`${label} period`}
        aria-invalid={invalid}
        disabled={disabled}
        className="min-w-0 flex-1 px-2"
        placeholder="AM/PM"
        value={valid ? period : ""}
        onValueChange={(next) => change(hour, minute, next)}
        options={[
          { value: "AM", label: "AM" },
          { value: "PM", label: "PM" },
        ]}
      />
    </div>
  );
}

export function DateTimePicker({
  value,
  onValueChange,
  label,
  id,
  invalid,
  describedBy,
  inputRef,
  onBlur,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  id: string;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: ComponentProps<"input">["ref"];
  onBlur?: ComponentProps<"input">["onBlur"];
}) {
  const [date = "", time = ""] = value.split("T");
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="space-y-2">
      <DatePicker
        ref={inputRef}
        onBlur={onBlur}
        id={id}
        label={`${label} date`}
        value={date}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onValueChange={(next) =>
          onValueChange(next ? `${next}T${time || "09:00"}` : "")
        }
      />
      <TimePicker
        label={`${label} time`}
        value={time}
        invalid={invalid}
        describedBy={describedBy}
        onValueChange={(next) =>
          onValueChange(`${date || businessDate()}T${next}`)
        }
      />
    </div>
  );
}

export function DatesPicker({
  value,
  onValueChange,
  label,
  id,
  invalid,
  describedBy,
  inputRef,
  onBlur,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  label: string;
  id: string;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: ComponentProps<"input">["ref"];
  onBlur?: ComponentProps<"input">["onBlur"];
}) {
  const [draft, setDraft] = useState("");
  const dates = value.filter(isCalendarDate);
  return (
    <div className="space-y-2">
      <DatePicker
        ref={inputRef}
        onBlur={onBlur}
        id={id}
        label={label}
        value={draft}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onValueChange={(next) => {
          if (isCalendarDate(next)) {
            onValueChange([...new Set([...dates, next])].sort());
            setDraft("");
          } else {
            // Keep incomplete input in the form value so validation prevents a
            // save from silently dropping the date the user is still entering.
            onValueChange(next ? [...dates, next] : dates);
            setDraft(next);
          }
        }}
      />
      {dates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dates.map((date) => (
            <span
              key={date}
              className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs text-accent-foreground"
            >
              {date}
              <button
                type="button"
                aria-label={`Remove ${date}`}
                onClick={() =>
                  onValueChange(value.filter((item) => item !== date))
                }
                className="grid size-5 place-items-center rounded-full hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
