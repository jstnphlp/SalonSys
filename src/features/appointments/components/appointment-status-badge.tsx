import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Appointment } from "../schemas";
export const appointmentStatusLabels: Record<Appointment["status"], string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  in_service: "In service",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};
const tones: Record<Appointment["status"], string> = {
  scheduled: "bg-blue-50 text-blue-700",
  checked_in: "bg-amber-50 text-amber-700",
  in_service: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-rose-50 text-rose-700",
};
export function AppointmentStatusBadge({
  status,
}: {
  status: Appointment["status"];
}) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", tones[status])}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {appointmentStatusLabels[status]}
    </Badge>
  );
}
