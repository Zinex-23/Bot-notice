import { prisma } from "../prisma";
import {
  combineVietnamDateAndTime,
  detectConflicts,
  getVietnamDateString,
  isOccurrenceOnDate,
  minutesToTimeString,
  timeStringToMinutes,
} from "./engine";
import { OccurrenceStatus, TaskCategory, TaskPriority, TimeSlotItem } from "./types";

export interface CreateScheduleInput {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  startTime: string; // "HH:mm"
  durationMinutes?: number;
  startDate?: string; // "YYYY-MM-DD"
  recurrenceType?: string; // ONCE, DAILY, etc.
  recurrenceDays?: number[]; // [1,2,3,4,5]
  targetValue?: number;
  targetUnit?: string;
  telegramEnabled?: boolean;
  allowSnooze?: boolean;
  snoozeMinutes?: number;
  isActive?: boolean;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  scope?: "THIS_OCCURRENCE" | "THIS_AND_FUTURE" | "ALL";
  occurrenceId?: string;
}

/**
 * Ensures all occurrences and notification jobs for a specific date are generated from active schedules.
 */
export async function syncDailyOccurrences(userId: string, dateStr: string): Promise<void> {
  // Find all active schedules for this user
  const schedules = await prisma.taskSchedule.findMany({
    where: {
      isDeleted: false,
      task: {
        userId,
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      task: true,
    },
  });

  for (const schedule of schedules) {
    if (!isOccurrenceOnDate(schedule, dateStr)) {
      continue;
    }

    const scheduledAt = combineVietnamDateAndTime(dateStr, schedule.startTime);

    // Check if occurrence already exists
    const existing = await prisma.taskOccurrence.findFirst({
      where: {
        taskId: schedule.taskId,
        scheduledAt,
      },
    });

    if (!existing) {
      const occurrence = await prisma.taskOccurrence.create({
        data: {
          taskId: schedule.taskId,
          scheduleId: schedule.id,
          scheduledAt,
          status: "PENDING",
        },
      });

      // Create notification job if telegram reminder is enabled
      if (schedule.task.telegramEnabled) {
        await prisma.notificationJob.create({
          data: {
            occurrenceId: occurrence.id,
            scheduledFor: scheduledAt,
            status: "PENDING",
          },
        });
      }
    }
  }
}

/**
 * Fetches all scheduled items for a 24-hour day with conflict detection and status details.
 */
export async function getPlannerDay(userId: string, dateStr: string) {
  // Sync occurrences first
  await syncDailyOccurrences(userId, dateStr);

  const startOfDay = combineVietnamDateAndTime(dateStr, "00:00");
  const endOfDay = combineVietnamDateAndTime(dateStr, "23:59:59");

  // Fetch occurrences for the day
  const occurrences = await prisma.taskOccurrence.findMany({
    where: {
      task: {
        userId,
        deletedAt: null,
      },
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      task: true,
      schedule: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  // Transform into TimeSlotItem list
  const rawItems: TimeSlotItem[] = occurrences.map((occ) => {
    const vnTime = occ.schedule?.startTime || "00:00";
    return {
      id: occ.id,
      occurrenceId: occ.id,
      taskId: occ.taskId,
      scheduleId: occ.scheduleId || undefined,
      title: occ.task.title,
      description: occ.task.description,
      category: occ.task.category as TaskCategory,
      priority: occ.task.priority as TaskPriority,
      startTime: vnTime,
      durationMinutes: occ.schedule?.durationMinutes || 0,
      scheduledAt: occ.scheduledAt,
      status: occ.status as OccurrenceStatus,
      snoozedUntil: occ.snoozedUntil,
      targetValue: occ.task.targetValue,
      targetUnit: occ.task.targetUnit,
      completionValue: occ.completionValue,
      telegramEnabled: occ.task.telegramEnabled,
      allowSnooze: occ.schedule?.allowSnooze ?? true,
      snoozeMinutes: occ.schedule?.snoozeMinutes ?? 15,
      isActive: occ.task.isActive,
    };
  });

  // Run conflict detection
  const conflictResult = detectConflicts(
    rawItems.map((item) => ({
      id: item.id,
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      title: item.title,
    }))
  );

  // Annotate items with conflict info
  const items: TimeSlotItem[] = rawItems.map((item) => {
    const itemConflicts = conflictResult.conflicts
      .filter((c) => c.taskAId === item.id || c.taskBId === item.id)
      .map((c) => (c.taskAId === item.id ? c.taskBId : c.taskAId));

    return {
      ...item,
      hasConflict: conflictResult.conflictingIds.has(item.id),
      conflictWith: itemConflicts,
    };
  });

  // Calculate day summary metrics
  const totalTasks = items.length;
  const completedTasks = items.filter((i) => i.status === "COMPLETED").length;
  const pendingTasks = items.filter((i) => i.status === "PENDING" || i.status === "SNOOZED").length;
  const skippedTasks = items.filter((i) => i.status === "SKIPPED").length;
  const missedTasks = items.filter((i) => i.status === "MISSED").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Water calculations
  const waterItems = items.filter((i) => i.category === "WATER" && i.status === "COMPLETED");
  const waterConsumedMl = waterItems.reduce((acc, curr) => acc + (curr.targetValue || 250), 0);

  // Exercise minutes
  const exerciseItems = items.filter((i) => i.category === "EXERCISE" && i.status === "COMPLETED");
  const exerciseMinutes = exerciseItems.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Study minutes
  const studyItems = items.filter((i) => i.category === "STUDY" && i.status === "COMPLETED");
  const studyMinutes = studyItems.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  return {
    date: dateStr,
    items,
    conflicts: conflictResult.conflicts,
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      skippedTasks,
      missedTasks,
      completionRate,
      waterConsumedMl,
      exerciseMinutes,
      studyMinutes,
    },
  };
}

/**
 * Creates a new task and its schedule dynamically.
 */
export async function createScheduleItem(userId: string, input: CreateScheduleInput) {
  const startDateStr = input.startDate || getVietnamDateString();
  const effectiveFrom = combineVietnamDateAndTime(startDateStr, "00:00");

  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      category: input.category || "OTHER",
      priority: input.priority || "MEDIUM",
      targetValue: input.targetValue,
      targetUnit: input.targetUnit,
      isActive: input.isActive ?? true,
      telegramEnabled: input.telegramEnabled ?? true,
      schedules: {
        create: {
          startTime: input.startTime,
          durationMinutes: input.durationMinutes || 0,
          recurrenceType: input.recurrenceType || "DAILY",
          recurrenceDays: JSON.stringify(input.recurrenceDays || []),
          effectiveFrom,
          allowSnooze: input.allowSnooze ?? true,
          snoozeMinutes: input.snoozeMinutes ?? 15,
        },
      },
    },
    include: {
      schedules: true,
    },
  });

  const schedule = task.schedules[0];

  // If the schedule applies to today, generate today's occurrence and notification job immediately
  const todayStr = getVietnamDateString();
  if (schedule && isOccurrenceOnDate(schedule, todayStr)) {
    const scheduledAt = combineVietnamDateAndTime(todayStr, input.startTime);
    const occurrence = await prisma.taskOccurrence.create({
      data: {
        taskId: task.id,
        scheduleId: schedule.id,
        scheduledAt,
        status: "PENDING",
      },
    });

    if (task.telegramEnabled) {
      await prisma.notificationJob.create({
        data: {
          occurrenceId: occurrence.id,
          scheduledFor: scheduledAt,
          status: "PENDING",
        },
      });
    }
  }

  return task;
}

/**
 * Updates a schedule item with support for scope:
 * - THIS_OCCURRENCE: only change this single date occurrence
 * - THIS_AND_FUTURE: split schedule effective from this date forward
 * - ALL: change the whole recurrence template
 */
export async function updateScheduleItem(
  userId: string,
  taskId: string,
  input: UpdateScheduleInput
) {
  const scope = input.scope || "ALL";

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: { schedules: { where: { isDeleted: false } } },
  });

  if (!task) {
    throw new Error("Không tìm thấy hoạt động cần cập nhật.");
  }

  const currentSchedule = task.schedules[0];

  if (scope === "THIS_OCCURRENCE" && input.occurrenceId) {
    // Only adjust this single occurrence
    const occ = await prisma.taskOccurrence.findUnique({
      where: { id: input.occurrenceId },
    });

    if (occ) {
      const dateStr = getVietnamDateString(occ.scheduledAt);
      const newTime = input.startTime || currentSchedule?.startTime || "09:00";
      const newScheduledAt = combineVietnamDateAndTime(dateStr, newTime);

      await prisma.taskOccurrence.update({
        where: { id: input.occurrenceId },
        data: {
          scheduledAt: newScheduledAt,
          status: occ.status === "MISSED" ? "PENDING" : occ.status,
        },
      });

      // Update or cancel existing notification job
      await prisma.notificationJob.updateMany({
        where: { occurrenceId: input.occurrenceId, status: "PENDING" },
        data: {
          scheduledFor: newScheduledAt,
          status: "PENDING",
        },
      });
    }

    return task;
  }

  // Update base task fields
  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title ?? task.title,
      description: input.description !== undefined ? input.description : task.description,
      category: input.category ?? task.category,
      priority: input.priority ?? task.priority,
      targetValue: input.targetValue !== undefined ? input.targetValue : task.targetValue,
      targetUnit: input.targetUnit !== undefined ? input.targetUnit : task.targetUnit,
      telegramEnabled: input.telegramEnabled ?? task.telegramEnabled,
      isActive: input.isActive ?? task.isActive,
    },
  });

  if (currentSchedule) {
    const todayStr = getVietnamDateString();
    const effectiveFrom = combineVietnamDateAndTime(todayStr, "00:00");

    if (scope === "THIS_AND_FUTURE") {
      // Mark old schedule ending yesterday
      const yesterday = new Date(effectiveFrom.getTime() - 24 * 60 * 60 * 1000);
      await prisma.taskSchedule.update({
        where: { id: currentSchedule.id },
        data: { effectiveUntil: yesterday },
      });

      // Create new schedule from today forward
      await prisma.taskSchedule.create({
        data: {
          taskId,
          startTime: input.startTime ?? currentSchedule.startTime,
          durationMinutes: input.durationMinutes ?? currentSchedule.durationMinutes,
          recurrenceType: input.recurrenceType ?? currentSchedule.recurrenceType,
          recurrenceDays: input.recurrenceDays
            ? JSON.stringify(input.recurrenceDays)
            : currentSchedule.recurrenceDays,
          effectiveFrom,
          allowSnooze: input.allowSnooze ?? currentSchedule.allowSnooze,
          snoozeMinutes: input.snoozeMinutes ?? currentSchedule.snoozeMinutes,
        },
      });
    } else {
      // ALL
      await prisma.taskSchedule.update({
        where: { id: currentSchedule.id },
        data: {
          startTime: input.startTime ?? currentSchedule.startTime,
          durationMinutes: input.durationMinutes ?? currentSchedule.durationMinutes,
          recurrenceType: input.recurrenceType ?? currentSchedule.recurrenceType,
          recurrenceDays: input.recurrenceDays
            ? JSON.stringify(input.recurrenceDays)
            : currentSchedule.recurrenceDays,
          allowSnooze: input.allowSnooze ?? currentSchedule.allowSnooze,
          snoozeMinutes: input.snoozeMinutes ?? currentSchedule.snoozeMinutes,
        },
      });
    }

    // Invalidate/Cancel any future pending notification jobs to prevent stale dispatches
    const futureOccurrences = await prisma.taskOccurrence.findMany({
      where: {
        taskId,
        scheduledAt: { gte: new Date() },
        status: "PENDING",
      },
    });

    for (const fo of futureOccurrences) {
      await prisma.notificationJob.updateMany({
        where: { occurrenceId: fo.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      // Update occurrence scheduled time if time changed
      if (input.startTime) {
        const occDateStr = getVietnamDateString(fo.scheduledAt);
        const updatedTime = combineVietnamDateAndTime(occDateStr, input.startTime);
        await prisma.taskOccurrence.update({
          where: { id: fo.id },
          data: { scheduledAt: updatedTime },
        });

        // Recreate notification job with new time
        if (input.telegramEnabled ?? task.telegramEnabled) {
          await prisma.notificationJob.create({
            data: {
              occurrenceId: fo.id,
              scheduledFor: updatedTime,
              status: "PENDING",
            },
          });
        }
      }
    }
  }

  return task;
}

/**
 * Drag-and-drop support: Reposition a task occurrence to a new time slot.
 */
export async function rescheduleOccurrence(
  userId: string,
  occurrenceId: string,
  newStartTime: string
) {
  const occ = await prisma.taskOccurrence.findFirst({
    where: {
      id: occurrenceId,
      task: { userId },
    },
    include: {
      task: true,
      schedule: true,
    },
  });

  if (!occ) {
    throw new Error("Không tìm thấy phiên hoạt động.");
  }

  const dateStr = getVietnamDateString(occ.scheduledAt);
  const newScheduledAt = combineVietnamDateAndTime(dateStr, newStartTime);

  // Update occurrence
  await prisma.taskOccurrence.update({
    where: { id: occurrenceId },
    data: {
      scheduledAt: newScheduledAt,
      status: occ.status === "MISSED" ? "PENDING" : occ.status,
    },
  });

  // Cancel any old pending jobs for this occurrence
  await prisma.notificationJob.updateMany({
    where: { occurrenceId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  // Create new notification job at the new time if Telegram reminder is active
  if (occ.task.telegramEnabled && occ.task.isActive) {
    await prisma.notificationJob.create({
      data: {
        occurrenceId,
        scheduledFor: newScheduledAt,
        status: "PENDING",
      },
    });
  }

  return { occurrenceId, newStartTime, scheduledAt: newScheduledAt };
}

/**
 * Toggle task enabled / disabled.
 * When disabled: immediately cancels pending notifications.
 */
export async function toggleTaskActive(userId: string, taskId: string, isActive: boolean) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Không tìm thấy công việc.");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { isActive },
  });

  if (!isActive) {
    // Cancel all future pending notification jobs
    const pendingOccurrences = await prisma.taskOccurrence.findMany({
      where: { taskId, status: "PENDING", scheduledAt: { gte: new Date() } },
      select: { id: true },
    });

    const occIds = pendingOccurrences.map((o) => o.id);
    if (occIds.length > 0) {
      await prisma.notificationJob.updateMany({
        where: { occurrenceId: { in: occIds }, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }
  }

  return { taskId, isActive };
}

/**
 * Deletes a reminder with options:
 * - THIS_OCCURRENCE: cancels this occurrence only, keeps history
 * - ALL: soft deletes task, cancels all future notifications, preserves analytics
 */
export async function deleteScheduleItem(
  userId: string,
  taskId: string,
  scope: "THIS_OCCURRENCE" | "ALL" = "ALL",
  occurrenceId?: string
) {
  if (scope === "THIS_OCCURRENCE" && occurrenceId) {
    // Cancel this occurrence
    await prisma.taskOccurrence.update({
      where: { id: occurrenceId },
      data: { status: "SKIPPED" },
    });

    await prisma.notificationJob.updateMany({
      where: { occurrenceId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    return { success: true, scope: "THIS_OCCURRENCE", occurrenceId };
  }

  // ALL: soft delete task
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date(), isActive: false },
  });

  // Soft delete schedule
  await prisma.taskSchedule.updateMany({
    where: { taskId },
    data: { isDeleted: true },
  });

  // Cancel all future pending notification jobs
  const pendingOccurrences = await prisma.taskOccurrence.findMany({
    where: { taskId, scheduledAt: { gte: new Date() }, status: "PENDING" },
    select: { id: true },
  });

  const occIds = pendingOccurrences.map((o) => o.id);
  if (occIds.length > 0) {
    await prisma.notificationJob.updateMany({
      where: { occurrenceId: { in: occIds }, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  return { success: true, scope: "ALL", taskId };
}

/**
 * Marks an occurrence as completed (from Web or Telegram).
 * Persists completion, records WaterIntake if category is WATER, answers callbacks.
 */
export async function completeTaskOccurrence(
  userId: string,
  occurrenceId: string,
  value?: number,
  source: "WEB" | "TELEGRAM" = "WEB",
  telegramMessageId?: string
) {
  const occ = await prisma.taskOccurrence.findFirst({
    where: {
      id: occurrenceId,
      task: { userId },
    },
    include: {
      task: true,
    },
  });

  if (!occ) {
    throw new Error("Không tìm thấy phiên công việc.");
  }

  const completedAt = new Date();
  const completionValue = value ?? occ.task.targetValue ?? 1;

  // Atomically update occurrence and create completion record
  const [, completion] = await prisma.$transaction([
    prisma.taskOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: "COMPLETED",
        completedAt,
        completionValue,
        source,
      },
    }),
    prisma.taskCompletion.upsert({
      where: { occurrenceId },
      update: {
        completedAt,
        value: completionValue,
        source,
        telegramMessageId,
      },
      create: {
        occurrenceId,
        taskId: occ.taskId,
        completedAt,
        value: completionValue,
        source,
        telegramMessageId,
      },
    }),
    // Cancel any remaining pending notification jobs for this occurrence
    prisma.notificationJob.updateMany({
      where: { occurrenceId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),
  ]);

  // If WATER, record water intake
  if (occ.task.category === "WATER") {
    const dateStr = getVietnamDateString(completedAt);
    await prisma.waterIntake.create({
      data: {
        userId,
        occurrenceId,
        amountMl: Math.round(completionValue),
        loggedAt: completedAt,
        date: dateStr,
        source,
      },
    });
  }

  return { occurrenceId, status: "COMPLETED", completion };
}

/**
 * Snoozes an occurrence for N minutes.
 */
export async function snoozeOccurrence(
  userId: string,
  occurrenceId: string,
  minutes = 15
) {
  const occ = await prisma.taskOccurrence.findFirst({
    where: { id: occurrenceId, task: { userId } },
    include: { task: true },
  });

  if (!occ) {
    throw new Error("Không tìm thấy công việc cần nhắc lại.");
  }

  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.taskOccurrence.update({
    where: { id: occurrenceId },
    data: {
      status: "SNOOZED",
      snoozedUntil,
    },
  });

  // Cancel current pending jobs
  await prisma.notificationJob.updateMany({
    where: { occurrenceId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  // Create new notification job at snoozedUntil
  await prisma.notificationJob.create({
    data: {
      occurrenceId,
      scheduledFor: snoozedUntil,
      status: "PENDING",
    },
  });

  return { occurrenceId, status: "SNOOZED", snoozedUntil };
}
