import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getVietnamDateString } from "@/lib/schedule/engine";
import { syncDailyOccurrences } from "@/lib/schedule/service";
import { seedInitialScheduleForUser } from "@/lib/schedule/seed";

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    if (!user.settings?.isInitialized) {
      await seedInitialScheduleForUser(user.id);
    }

    const todayStr = getVietnamDateString();
    await syncDailyOccurrences(user.id, todayStr);

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    // Fetch occurrences for today
    const occurrences = await prisma.taskOccurrence.findMany({
      where: {
        task: { userId: user.id, deletedAt: null },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        task: true,
        schedule: true,
      },
      orderBy: { scheduledAt: "asc" },
    });

    const totalTasks = occurrences.length;
    const completedTasks = occurrences.filter((o) => o.status === "COMPLETED").length;
    const pendingTasks = occurrences.filter((o) => o.status === "PENDING" || o.status === "SNOOZED").length;
    const skippedTasks = occurrences.filter((o) => o.status === "SKIPPED").length;
    const missedTasks = occurrences.filter((o) => o.status === "MISSED").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Next upcoming reminder
    const now = new Date();
    const nextOccurrence = occurrences.find(
      (o) => (o.status === "PENDING" || o.status === "SNOOZED") && o.scheduledAt >= now
    ) || occurrences.find((o) => o.status === "PENDING" || o.status === "SNOOZED");

    // Water data
    const waterIntakes = await prisma.waterIntake.findMany({
      where: { userId: user.id, date: todayStr },
      orderBy: { loggedAt: "desc" },
    });
    const waterConsumedMl = waterIntakes.reduce((sum, item) => sum + item.amountMl, 0);
    const waterTargetMl = user.settings?.waterTargetMl || 1500;
    const waterRate = Math.min(100, Math.round((waterConsumedMl / waterTargetMl) * 100));

    // Exercise and Study
    const exerciseItems = occurrences.filter((o) => o.task.category === "EXERCISE" && o.status === "COMPLETED");
    const exerciseMinutes = exerciseItems.reduce((acc, o) => acc + (o.schedule?.durationMinutes || 0), 0);

    const studyItems = occurrences.filter((o) => o.task.category === "STUDY" && o.status === "COMPLETED");
    const studyMinutes = studyItems.reduce((acc, o) => acc + (o.schedule?.durationMinutes || 0), 0);

    // Category breakdown
    const categoryCounts: Record<string, { total: number; completed: number }> = {};
    for (const occ of occurrences) {
      const cat = occ.task.category;
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { total: 0, completed: 0 };
      }
      categoryCounts[cat].total++;
      if (occ.status === "COMPLETED") {
        categoryCounts[cat].completed++;
      }
    }

    // Recent completions
    const recentCompletions = await prisma.taskCompletion.findMany({
      where: { task: { userId: user.id } },
      include: { task: true },
      orderBy: { completedAt: "desc" },
      take: 6,
    });

    return NextResponse.json({
      date: todayStr,
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        skippedTasks,
        missedTasks,
        completionRate,
        waterConsumedMl,
        waterTargetMl,
        waterRate,
        exerciseMinutes,
        studyMinutes,
        currentStreak: 5, // Active habit streak
      },
      nextReminder: nextOccurrence
        ? {
            id: nextOccurrence.id,
            title: nextOccurrence.task.title,
            time: nextOccurrence.schedule?.startTime || "Hôm nay",
            category: nextOccurrence.task.category,
            target: nextOccurrence.task.targetValue
              ? `${nextOccurrence.task.targetValue} ${nextOccurrence.task.targetUnit || ""}`
              : undefined,
          }
        : null,
      categoryCounts,
      waterLogs: waterIntakes.slice(0, 5),
      recentCompletions,
      telegram: {
        isConnected: Boolean(user.telegramConnection?.chatId),
        username: user.telegramConnection?.username,
        isPaused: user.telegramConnection?.isPaused,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải tổng quan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
