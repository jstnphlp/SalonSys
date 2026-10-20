export const BUSINESS_TIMEZONE = "Asia/Manila";
export function businessDate(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function dateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        timeZone: BUSINESS_TIMEZONE,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}
export function toLocalInput(value: string) {
  return new Date(new Date(value).getTime() + 8 * 3600000)
    .toISOString()
    .slice(0, 16);
}
export function toUtc(value: string) {
  return new Date(`${value}:00+08:00`).toISOString();
}
export function addDays(value: string, days: number) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function php(value: number | string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value));
}
export function centavos(value: string) {
  const [whole, fraction = ""] = value.split(".");
  const negative = value.startsWith("-");
  return (
    BigInt(whole) * 100n +
    (negative ? -1n : 1n) * BigInt(fraction.padEnd(2, "0"))
  );
}
export function decimal(value: bigint) {
  const abs = value < 0n ? -value : value;
  return `${value < 0n ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
}
export function payableMinutes(
  start: string,
  end: string,
  breakMinutes: number,
) {
  return Math.max(
    0,
    Math.floor((Date.parse(end) - Date.parse(start)) / 60000) - breakMinutes,
  );
}
// For estimates only. All payable arithmetic runs in PostgreSQL numeric.
export function estimateEnd(start: string, minutes: number) {
  return new Date(
    Date.parse(`${start}:00+08:00`) + minutes * 60000,
  ).toISOString();
}
export function hasStaleShift(entries: { clock_in_at: string }[]) {
  const now = Date.now();
  return entries.some((e) => now - Date.parse(e.clock_in_at) > 16 * 3600000);
}
