"use client";
import type { ReactNode } from "react";
import { toLocalInput } from "@/features/salon/domain";
import { cn } from "@/lib/utils";
import type { Appointment } from "../schemas";

type Column = {
  id: string;
  label: string;
  detail?: string;
  selected?: boolean;
  appointments: Appointment[];
  onSelect?: () => void;
};
const minutes = (time: string) => {
  const local = toLocalInput(time);
  return Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16));
};
function positionEvents(events: Appointment[]) {
  const result = new Map<string, { lane: number; count: number }>();
  let group: { id: string; lane: number }[] = [],
    ends: number[] = [],
    groupEnd = -1;
  const finish = () => {
    group.forEach((event) =>
      result.set(event.id, { lane: event.lane, count: ends.length }),
    );
    group = [];
    ends = [];
  };
  for (const event of [...events].sort(
    (a, b) => Date.parse(a.start_at) - Date.parse(b.start_at),
  )) {
    const start = Date.parse(event.start_at),
      end = Date.parse(event.end_at);
    if (start >= groupEnd) {
      finish();
      groupEnd = end;
    }
    let lane = ends.findIndex((time) => time <= start);
    if (lane < 0) lane = ends.length;
    ends[lane] = end;
    group.push({ id: event.id, lane });
    groupEnd = Math.max(groupEnd, end);
  }
  finish();
  return result;
}
export function ScheduleGrid({
  columns,
  renderEvent,
}: {
  columns: Column[];
  renderEvent: (a: Appointment, compact: boolean) => ReactNode;
}) {
  const events = columns.flatMap((c) => c.appointments);
  const firstHour = Math.floor(
    Math.min(8 * 60, ...events.map((e) => minutes(e.start_at))) / 60,
  );
  const lastHour = Math.min(
    24,
    Math.ceil(Math.max(20 * 60, ...events.map((e) => minutes(e.end_at))) / 60),
  );
  const gridTemplateColumns = `64px repeat(${Math.max(1, columns.length)},minmax(0,1fr))`;
  return (
    <div
      role="region"
      aria-label="Appointment calendar"
      className="overflow-x-auto rounded-[14px] bg-card shadow-[0_1px_2px_rgba(15,23,42,0.03)] ring-1 ring-border/70"
    >
      <div style={{ minWidth: Math.max(540, columns.length * 145 + 64) }}>
        <div
          className="grid border-b border-border/60"
          style={{ gridTemplateColumns }}
        >
          <div className="flex items-end justify-center pb-3 text-[9px] text-muted-foreground">
            Manila
          </div>
          {columns.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={!c.onSelect}
              onClick={c.onSelect}
              className={cn(
                "border-l border-border/60 px-2 py-3 text-center disabled:cursor-default",
                c.selected && "bg-accent/60",
              )}
            >
              <span className="block truncate text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {c.label}
              </span>
              {c.detail && (
                <span
                  className={cn(
                    "mx-auto mt-1 grid size-7 place-items-center rounded-full text-xs font-semibold",
                    c.selected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {c.detail}
                </span>
              )}
            </button>
          ))}
        </div>
        <div
          className="schedule-grid relative grid"
          style={{ gridTemplateColumns, height: (lastHour - firstHour) * 60 }}
        >
          <div className="relative">
            {Array.from({ length: lastHour - firstHour }, (_, index) => (
              <span
                key={index}
                className="absolute right-3 text-[9px] font-medium text-muted-foreground"
                style={{ top: index * 60 + 5 }}
              >
                {(firstHour + index) % 12 || 12}{" "}
                {firstHour + index < 12 ? "AM" : "PM"}
              </span>
            ))}
          </div>
          {columns.map((c) => {
            const positions = positionEvents(c.appointments);
            return (
              <div
                key={c.id}
                className={cn(
                  "relative min-w-0 border-l border-border/60",
                  c.selected && "bg-accent/25",
                )}
              >
                {c.appointments.map((a) => {
                  const p = positions.get(a.id)!;
                  return (
                    <div
                      key={a.id}
                      className="absolute px-1"
                      style={{
                        top: minutes(a.start_at) - firstHour * 60 + 2,
                        height: Math.max(
                          38,
                          minutes(a.end_at) - minutes(a.start_at) - 4,
                        ),
                        left: `${(p.lane / p.count) * 100}%`,
                        width: `${100 / p.count}%`,
                      }}
                    >
                      {renderEvent(a, true)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
