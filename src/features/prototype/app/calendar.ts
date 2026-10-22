import type { Memory } from "./model";

/** Local completion days, following Rebecca Sun's SidequestCalendar in commit 8516b88. */
export function localDayKey(value: string | Date): string | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime())
    ? null
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function groupMemoryDays(memories: readonly Memory[]) {
  const days = new Map<string, Memory[]>();
  for (const memory of memories) {
    const key = localDayKey(memory.completedAt);
    if (key) days.set(key, [...(days.get(key) ?? []), memory]);
  }
  return days;
}
export function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1),
    count = new Date(year, month + 1, 0).getDate();
  return {
    leading: (first.getDay() + 6) % 7,
    days: Array.from({ length: count }, (_, i) => ({
      day: i + 1,
      key: localDayKey(new Date(year, month, i + 1))!,
    })),
  };
}
export function memoriesOnDay(memories: readonly Memory[], day: string | null) {
  return day
    ? memories.filter((m) => localDayKey(m.completedAt) === day)
    : memories;
}
