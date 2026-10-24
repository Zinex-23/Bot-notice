import { describe, it, expect } from "vitest";
import {
  getVietnamDateString,
  timeStringToMinutes,
  minutesToTimeString,
  combineVietnamDateAndTime,
  getVietnamDayOfWeek,
  isOccurrenceOnDate,
  detectConflicts,
} from "../src/lib/schedule/engine";

describe("Schedule Engine - Timezone & Time Conversions", () => {
  it("converts time string to minutes and back", () => {
    expect(timeStringToMinutes("00:00")).toBe(0);
    expect(timeStringToMinutes("09:30")).toBe(570);
    expect(timeStringToMinutes("17:30")).toBe(1050);
    expect(timeStringToMinutes("23:59")).toBe(1439);

    expect(minutesToTimeString(0)).toBe("00:00");
    expect(minutesToTimeString(570)).toBe("09:30");
    expect(minutesToTimeString(1050)).toBe("17:30");
    expect(minutesToTimeString(1439)).toBe("23:59");
  });

  it("combines Vietnam date and time to UTC Date accurately (UTC+7)", () => {
    // 2026-10-24 09:30 in VN should equal 2026-10-24 02:30:00 UTC
    const date = combineVietnamDateAndTime("2026-10-24", "09:30");
    expect(date.toISOString()).toBe("2026-10-24T02:30:00.000Z");

    // 2026-10-24 02:15 in VN should equal 2026-10-23 19:15:00 UTC (crosses midnight)
    const midnightCross = combineVietnamDateAndTime("2026-10-24", "02:15");
    expect(midnightCross.toISOString()).toBe("2026-10-23T19:15:00.000Z");

    // Converting that UTC date back to VN date string yields 2026-10-24
    expect(getVietnamDateString(midnightCross)).toBe("2026-10-24");
  });

  it("calculates day of week correctly for Vietnam timezone", () => {
    // 2026-10-24 is Saturday (6)
    expect(getVietnamDayOfWeek("2026-10-24")).toBe(6);
    // 2026-10-25 is Sunday (0)
    expect(getVietnamDayOfWeek("2026-10-25")).toBe(0);
    // 2026-10-26 is Monday (1)
    expect(getVietnamDayOfWeek("2026-10-26")).toBe(1);
  });
});

describe("Schedule Engine - Recurrence Rules", () => {
  const baseSchedule = {
    recurrenceType: "DAILY",
    recurrenceDays: "[]",
    effectiveFrom: new Date(Date.UTC(2026, 9, 20, 0, 0, 0)), // 2026-10-20
    effectiveUntil: null,
  };

  it("handles ONCE recurrence", () => {
    const onceSchedule = { ...baseSchedule, recurrenceType: "ONCE" };
    expect(isOccurrenceOnDate(onceSchedule, "2026-10-20")).toBe(true);
    expect(isOccurrenceOnDate(onceSchedule, "2026-10-21")).toBe(false);
  });

  it("handles DAILY recurrence", () => {
    expect(isOccurrenceOnDate(baseSchedule, "2026-10-24")).toBe(true);
    // Before effective date should be false
    expect(isOccurrenceOnDate(baseSchedule, "2026-10-19")).toBe(false);
  });

  it("handles WEEKDAYS recurrence (Mon-Fri)", () => {
    const weekdaysSchedule = { ...baseSchedule, recurrenceType: "WEEKDAYS" };
    // 2026-10-23 is Friday
    expect(isOccurrenceOnDate(weekdaysSchedule, "2026-10-23")).toBe(true);
    // 2026-10-24 is Saturday
    expect(isOccurrenceOnDate(weekdaysSchedule, "2026-10-24")).toBe(false);
    // 2026-10-25 is Sunday
    expect(isOccurrenceOnDate(weekdaysSchedule, "2026-10-25")).toBe(false);
    // 2026-10-26 is Monday
    expect(isOccurrenceOnDate(weekdaysSchedule, "2026-10-26")).toBe(true);
  });

  it("handles WEEKENDS recurrence (Sat-Sun)", () => {
    const weekendsSchedule = { ...baseSchedule, recurrenceType: "WEEKENDS" };
    expect(isOccurrenceOnDate(weekendsSchedule, "2026-10-24")).toBe(true); // Sat
    expect(isOccurrenceOnDate(weekendsSchedule, "2026-10-25")).toBe(true); // Sun
    expect(isOccurrenceOnDate(weekendsSchedule, "2026-10-26")).toBe(false); // Mon
  });

  it("handles CUSTOM recurrence days", () => {
    // Only Mon (1) and Wed (3)
    const customSchedule = {
      ...baseSchedule,
      recurrenceType: "CUSTOM",
      recurrenceDays: "[1, 3]",
    };
    expect(isOccurrenceOnDate(customSchedule, "2026-10-26")).toBe(true); // Mon
    expect(isOccurrenceOnDate(customSchedule, "2026-10-27")).toBe(false); // Tue
    expect(isOccurrenceOnDate(customSchedule, "2026-10-28")).toBe(true); // Wed
  });
});

describe("Schedule Engine - Conflict Detection", () => {
  it("detects overlapping activities and reports warning", () => {
    const activities = [
      {
        id: "task-1",
        title: "Làm bài tập",
        startTime: "19:30",
        durationMinutes: 60, // 19:30 - 20:30
      },
      {
        id: "task-2",
        title: "Vận động nhẹ",
        startTime: "20:00",
        durationMinutes: 10, // 20:00 - 20:10 (inside 19:30 - 20:30)
      },
      {
        id: "task-3",
        title: "Uống nước",
        startTime: "21:00",
        durationMinutes: 0,
      },
    ];

    const result = detectConflicts(activities);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingIds.has("task-1")).toBe(true);
    expect(result.conflictingIds.has("task-2")).toBe(true);
    expect(result.conflictingIds.has("task-3")).toBe(false);
    expect(result.conflicts[0].message).toContain("trùng thời gian");
  });

  it("returns no conflicts when activities are sequential", () => {
    const activities = [
      { id: "1", title: "A", startTime: "09:00", durationMinutes: 30 },
      { id: "2", title: "B", startTime: "09:30", durationMinutes: 30 },
      { id: "3", title: "C", startTime: "10:00", durationMinutes: 30 },
    ];

    const result = detectConflicts(activities);
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingIds.size).toBe(0);
  });
});
