import type { Appointment } from "./schemas";
export function nextStatuses(
  status: Appointment["status"],
): Appointment["status"][] {
  switch (status) {
    case "scheduled":
      return ["checked_in", "cancelled", "no_show"];
    case "checked_in":
      return ["in_service", "cancelled", "no_show"];
    case "in_service":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}
export function overlaps(
  start: string,
  end: string,
  otherStart: string,
  otherEnd: string,
) {
  return (
    Date.parse(start) < Date.parse(otherEnd) &&
    Date.parse(end) > Date.parse(otherStart)
  );
}
