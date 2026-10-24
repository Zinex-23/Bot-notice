export type RecurrenceType =
  | "ONCE"
  | "DAILY"
  | "WEEKDAYS"
  | "WEEKENDS"
  | "CUSTOM"
  | "WEEKLY"
  | "MONTHLY";

export type TaskCategory =
  | "WATER"
  | "EXERCISE"
  | "STUDY"
  | "WORK"
  | "HEALTH"
  | "OTHER";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type OccurrenceStatus =
  | "PENDING"
  | "COMPLETED"
  | "SKIPPED"
  | "SNOOZED"
  | "MISSED";

export interface TimeSlotItem {
  id: string;
  occurrenceId?: string;
  taskId: string;
  scheduleId?: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  startTime: string; // "HH:mm"
  durationMinutes: number;
  scheduledAt: Date;
  status: OccurrenceStatus;
  snoozedUntil?: Date | null;
  targetValue?: number | null;
  targetUnit?: string | null;
  completionValue?: number | null;
  hasConflict?: boolean;
  conflictWith?: string[];
  telegramEnabled: boolean;
  allowSnooze: boolean;
  snoozeMinutes: number;
  isActive: boolean;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    taskAId: string;
    taskBId: string;
    message: string;
  }>;
  conflictingIds: Set<string>;
}
