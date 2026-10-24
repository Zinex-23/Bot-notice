import { RecurrenceType, ConflictResult } from "./types";

export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET_HOURS = 7;

/**
 * Returns YYYY-MM-DD string in Asia/Ho_Chi_Minh timezone
 */
export function getVietnamDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA produces YYYY-MM-DD
}

/**
 * Returns current hour and minute in Asia/Ho_Chi_Minh timezone
 */
export function getVietnamTimeComponents(date: Date = new Date()): {
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIETNAM_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string) => {
    const val = parts.find((p) => p.type === type)?.value;
    return val ? parseInt(val, 10) : 0;
  };

  return {
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

/**
 * Parses "HH:mm" into minutes from midnight (0..1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  const hour = parseInt(hStr || "0", 10);
  const minute = parseInt(mStr || "0", 10);
  return hour * 60 + minute;
}

/**
 * Converts minutes from midnight into "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const min = normalized % 60;
  return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

/**
 * Combines a Vietnam date string (YYYY-MM-DD) and time string (HH:mm) into a UTC Date.
 * Vietnam is fixed at UTC+7 year-round (no DST).
 */
export function combineVietnamDateAndTime(dateStr: string, timeStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const [hourStr, minStr] = timeStr.split(":");

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // UTC time = Vietnam local time minus 7 hours
  return new Date(Date.UTC(year, month - 1, day, hour - VN_OFFSET_HOURS, minute, 0, 0));
}

/**
 * Extracts day of week in Vietnam timezone (0=Sun, 1=Mon, ..., 6=Sat)
 */
export function getVietnamDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Noon in Vietnam ensures middle of the day in UTC (05:00 UTC)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
  return utcDate.getUTCDay();
}

/**
 * Determines whether a schedule rule applies to a specific target date (YYYY-MM-DD)
 */
export function isOccurrenceOnDate(
  schedule: {
    recurrenceType: RecurrenceType | string;
    recurrenceDays: string; // JSON string e.g. "[1,2,3,4,5]"
    effectiveFrom: Date;
    effectiveUntil?: Date | null;
  },
  targetDateStr: string
): boolean {
  const effectiveFromStr = getVietnamDateString(schedule.effectiveFrom);

  // If target date is before effective date, false
  if (targetDateStr < effectiveFromStr) {
    return false;
  }

  // If target date is past effectiveUntil, false
  if (schedule.effectiveUntil) {
    const effectiveUntilStr = getVietnamDateString(schedule.effectiveUntil);
    if (targetDateStr > effectiveUntilStr) {
      return false;
    }
  }

  const targetDayOfWeek = getVietnamDayOfWeek(targetDateStr);

  switch (schedule.recurrenceType) {
    case "ONCE":
      return targetDateStr === effectiveFromStr;

    case "DAILY":
      return true;

    case "WEEKDAYS":
      // Mon (1) to Fri (5)
      return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;

    case "WEEKENDS":
      // Sun (0) or Sat (6)
      return targetDayOfWeek === 0 || targetDayOfWeek === 6;

    case "CUSTOM": {
      try {
        const allowedDays: number[] = JSON.parse(schedule.recurrenceDays || "[]");
        return allowedDays.includes(targetDayOfWeek);
      } catch {
        return false;
      }
    }

    case "WEEKLY": {
      const fromDayOfWeek = getVietnamDayOfWeek(effectiveFromStr);
      return targetDayOfWeek === fromDayOfWeek;
    }

    case "MONTHLY": {
      const [, , fromDay] = effectiveFromStr.split("-");
      const [, , targetDay] = targetDateStr.split("-");
      return fromDay === targetDay;
    }

    default:
      return true;
  }
}

/**
 * Detects overlapping schedule conflicts.
 * Activities with duration overlap if: startA < endB && startB < endA.
 * For activities with duration 0, treated as a 5-minute block for conflict checking.
 */
export function detectConflicts(
  activities: Array<{
    id: string;
    startTime: string;
    durationMinutes: number;
    title: string;
  }>
): ConflictResult {
  const conflicts: ConflictResult["conflicts"] = [];
  const conflictingIds = new Set<string>();

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    const startA = timeStringToMinutes(a.startTime);
    const durationA = Math.max(a.durationMinutes || 0, 5);
    const endA = startA + durationA;

    for (let j = i + 1; j < activities.length; j++) {
      const b = activities[j];
      const startB = timeStringToMinutes(b.startTime);
      const durationB = Math.max(b.durationMinutes || 0, 5);
      const endB = startB + durationB;

      // Overlap condition
      if (startA < endB && startB < endA) {
        conflictingIds.add(a.id);
        conflictingIds.add(b.id);
        conflicts.push({
          taskAId: a.id,
          taskBId: b.id,
          message: `⚠️ Hoạt động "${a.title}" (${a.startTime}) trùng thời gian với "${b.title}" (${b.startTime}).`,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    conflictingIds,
  };
}
