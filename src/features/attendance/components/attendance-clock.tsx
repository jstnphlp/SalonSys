"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FormMessage } from "@/components/shared/form-message";
import { dateTime } from "@/features/salon/domain";
import type { Attendance } from "../schemas";
import { punchAction } from "../actions";
export function AttendanceClock({
  openShift,
  hasProfile,
  now,
}: {
  openShift?: Attendance;
  hasProfile: boolean;
  now: string;
}) {
  const router = useRouter();
  const [time, setTime] = useState(now);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{
    status: "success" | "error";
    text: string;
  }>();
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="size-5 text-primary" />
          {openShift ? "You’re on duty" : "Ready for your shift?"}
        </CardTitle>
        <CardDescription>
          Clock times use the server clock. Asia/Manila.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-3xl font-semibold tabular-nums">
          {new Intl.DateTimeFormat("en-PH", {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date(time))}
        </p>
        {openShift && (
          <p className="text-sm text-muted-foreground">
            Clocked in {dateTime(openShift.clock_in_at)}
          </p>
        )}
        {!hasProfile ? (
          <p className="text-sm text-muted-foreground">
            Ask your salon owner to link your account to an active employee
            record to use the clock.
          </p>
        ) : (
          <Button
            disabled={pending}
            size="lg"
            onClick={() =>
              start(async () => {
                const result = await punchAction(openShift ? "out" : "in");
                setMessage({ status: result.status, text: result.message });
                if (result.status === "success") router.refresh();
              })
            }
          >
            {pending ? "Recording…" : openShift ? "Clock out" : "Clock in"}
          </Button>
        )}
        {message && (
          <FormMessage status={message.status}>{message.text}</FormMessage>
        )}
      </CardContent>
    </Card>
  );
}
