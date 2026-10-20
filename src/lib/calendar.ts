import { z } from "zod";

export function isCalendarDate(value: string) {
  return z.iso.date().safeParse(value).success;
}

export function calendarDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

export function shiftCalendarDay(value: string, days: number) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftCalendarMonth(value: string, months: number) {
  const date = calendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(date.getTime());
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, lastDay.getUTCDate()));
  return date.toISOString().slice(0, 10);
}

export function calendarDays(value: string) {
  const first = `${value.slice(0, 7)}-01`;
  const start = shiftCalendarDay(first, -calendarDate(first).getUTCDay());
  return Array.from({ length: 42 }, (_, i) => shiftCalendarDay(start, i));
}

export function calendarKeyboardDate(
  value: string,
  key: string,
  shift = false,
) {
  const day = calendarDate(value).getUTCDay();
  switch (key) {
    case "ArrowLeft":
      return shiftCalendarDay(value, -1);
    case "ArrowRight":
      return shiftCalendarDay(value, 1);
    case "ArrowUp":
      return shiftCalendarDay(value, -7);
    case "ArrowDown":
      return shiftCalendarDay(value, 7);
    case "Home":
      return shiftCalendarDay(value, -day);
    case "End":
      return shiftCalendarDay(value, 6 - day);
    case "PageUp":
      return shiftCalendarMonth(value, shift ? -12 : -1);
    case "PageDown":
      return shiftCalendarMonth(value, shift ? 12 : 1);
    default:
      return null;
  }
}
