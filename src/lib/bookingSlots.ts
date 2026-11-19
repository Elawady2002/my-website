import { siteConfig } from "@/data/site";

export interface BusyInterval {
  start: string;
  end: string;
}

export interface CalendarDayCell {
  dateKey: string;
  year: number;
  month: number;
  day: number;
  inCurrentMonth: boolean;
  isPast: boolean;
  isBeyondWindow: boolean;
  isToday: boolean;
}

export interface TimeSlotItem {
  startIso: string;
  endIso: string;
  startMs: number;
  endMs: number;
  label12h: string;
  endLabel12h: string;
  status: "available" | "booked" | "past";
}

export interface WallClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const FMT_CACHE = new Map<string, Intl.DateTimeFormat>();

function getCachedFormatter(
  cacheKey: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  let fmt = FMT_CACHE.get(cacheKey);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", options);
    if (FMT_CACHE.size > 64) {
      FMT_CACHE.clear();
    }
    FMT_CACHE.set(cacheKey, fmt);
  }
  return fmt;
}

export function getTimeZoneWallParts(
  ms: number,
  timeZone: string = siteConfig.booking.timezoneIana
): WallClockParts {
  const parts = getCachedFormatter(`wall:${timeZone}`, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));

  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = Number(part.value);
    }
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour === 24 ? 0 : map.hour,
    minute: map.minute,
    second: map.second,
  };
}

export function wallTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = siteConfig.booking.timezoneIana
): number {
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = desiredUtc;

  for (let i = 0; i < 2; i += 1) {
    const wall = getTimeZoneWallParts(guess, timeZone);
    const wallAsUtc = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      wall.minute,
      wall.second,
      0
    );
    const diff = desiredUtc - wallAsUtc;
    if (diff === 0) break;
    guess += diff;
  }

  return guess;
}

export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

export function getCairoTodayParts(nowMs: number = Date.now()) {
  const wall = getTimeZoneWallParts(nowMs, siteConfig.booking.timezoneIana);
  return {
    year: wall.year,
    month: wall.month,
    day: wall.day,
    dateKey: formatDateKey(wall.year, wall.month, wall.day),
  };
}

export function addDaysToCalendarDate(
  year: number,
  month: number,
  day: number,
  deltaDays: number
) {
  const d = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    dateKey: formatDateKey(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      d.getUTCDate()
    ),
  };
}

export function buildMonthGrid(
  year: number,
  month: number,
  nowMs: number = Date.now(),
  maxAdvanceDays: number = siteConfig.booking.maxAdvanceDays
): CalendarDayCell[] {
  const today = getCairoTodayParts(nowMs);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  const maxUtc = todayUtc + maxAdvanceDays * 86_400_000;

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOffset = firstOfMonth.getUTCDay(); // 0 = Sun
  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(Date.UTC(year, month - 1, 1 - startOffset + i));
    const cYear = cellDate.getUTCFullYear();
    const cMonth = cellDate.getUTCMonth() + 1;
    const cDay = cellDate.getUTCDate();
    const cellUtc = Date.UTC(cYear, cMonth - 1, cDay);

    cells.push({
      dateKey: formatDateKey(cYear, cMonth, cDay),
      year: cYear,
      month: cMonth,
      day: cDay,
      inCurrentMonth: cYear === year && cMonth === month,
      isPast: cellUtc < todayUtc,
      isBeyondWindow: cellUtc > maxUtc,
      isToday: cellUtc === todayUtc,
    });
  }

  return cells;
}

export function formatTime12h(
  ms: number,
  timeZone: string = siteConfig.booking.timezoneIana
): string {
  return getCachedFormatter(`t12:${timeZone}`, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(ms))
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function formatCairoClock12h(nowMs: number = Date.now()): string {
  try {
    return formatTime12h(nowMs, siteConfig.infoSection.timezoneIana);
  } catch {
    return "1:00 PM";
  }
}

export function formatMonthHeading(year: number, month: number): string {
  return getCachedFormatter("monthHeading:UTC", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  })
    .format(new Date(Date.UTC(year, month - 1, 15)))
    .toUpperCase();
}

export function formatDateHeading(
  year: number,
  month: number,
  day: number
): string {
  return getCachedFormatter("dateHeading:UTC", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .toUpperCase();
}

export function buildDaySlots({
  year,
  month,
  day,
  durationMinutes,
  busyIntervals,
  displayTimeZone = siteConfig.booking.timezoneIana,
  nowMs = Date.now(),
}: {
  year: number;
  month: number;
  day: number;
  durationMinutes: number;
  busyIntervals: readonly BusyInterval[];
  displayTimeZone?: string;
  nowMs?: number;
}): TimeSlotItem[] {
  const { startHour, endHour, slotStepMinutes, minLeadMinutes, timezoneIana } =
    siteConfig.booking;

  const parsedBusy = busyIntervals
    .map((b) => ({
      startMs: Date.parse(b.start),
      endMs: Date.parse(b.end),
    }))
    .filter((b) => Number.isFinite(b.startMs) && Number.isFinite(b.endMs));

  const startTotalMin = startHour * 60;
  const endTotalMin = endHour * 60;
  const minAllowedStartMs = nowMs + minLeadMinutes * 60_000;
  const slots: TimeSlotItem[] = [];

  for (
    let m = startTotalMin;
    m + durationMinutes <= endTotalMin;
    m += slotStepMinutes
  ) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    const startMs = wallTimeToUtcMs(
      year,
      month,
      day,
      hour,
      minute,
      timezoneIana
    );
    const endMs = startMs + durationMinutes * 60_000;

    let status: TimeSlotItem["status"] = "available";
    if (startMs < minAllowedStartMs) {
      status = "past";
    } else if (
      parsedBusy.some((b) => startMs < b.endMs && endMs > b.startMs)
    ) {
      status = "booked";
    }

    slots.push({
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
      startMs,
      endMs,
      label12h: formatTime12h(startMs, displayTimeZone),
      endLabel12h: formatTime12h(endMs, displayTimeZone),
      status,
    });
  }

  return slots;
}
