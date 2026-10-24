import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  combineVietnamDateAndTime,
  getVietnamDateString,
} from "@/lib/schedule/engine";

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    // Generate last 7 days strings
    const days: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(getVietnamDateString(d));
    }

    const startDate = combineVietnamDateAndTime(days[0], "00:00");
    const endDate = combineVietnamDateAndTime(days[days.length - 1], "23:59:59");

    const occurrences = await prisma.taskOccurrence.findMany({
      where: {
        task: { userId: user.id, deletedAt: null },
        scheduledAt: { gte: startDate, lte: endDate },
      },
      include: { task: true, schedule: true },
    });

    const waterIntakes = await prisma.waterIntake.findMany({
      where: {
        userId: user.id,
        date: { in: days },
      },
    });

    // Map by day
    const dayStats = days.map((dayStr) => {
      const dayStart = combineVietnamDateAndTime(dayStr, "00:00");
      const dayEnd = combineVietnamDateAndTime(dayStr, "23:59:59");

      const dayOccs = occurrences.filter(
        (o) => o.scheduledAt >= dayStart && o.scheduledAt <= dayEnd
      );

      const total = dayOccs.length;
      const completed = dayOccs.filter((o) => o.status === "COMPLETED").length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const dayWater = waterIntakes
        .filter((w) => w.date === dayStr)
        .reduce((sum, item) => sum + item.amountMl, 0);

      const dayExercise = dayOccs
        .filter((o) => o.task.category === "EXERCISE" && o.status === "COMPLETED")
        .reduce((sum, o) => sum + (o.schedule?.durationMinutes || 0), 0);

      const dayStudy = dayOccs
        .filter((o) => o.task.category === "STUDY" && o.status === "COMPLETED")
        .reduce((sum, o) => sum + (o.schedule?.durationMinutes || 0), 0);

      return {
        date: dayStr,
        dayOfWeek: new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          weekday: "short",
        }).format(combineVietnamDateAndTime(dayStr, "12:00")),
        total,
        completed,
        rate,
        waterMl: dayWater,
        exerciseMinutes: dayExercise,
        studyMinutes: dayStudy,
      };
    });

    const totalScheduled = dayStats.reduce((a, b) => a + b.total, 0);
    const totalDone = dayStats.reduce((a, b) => a + b.completed, 0);
    const weeklyRate =
      totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;
    const averageWaterMl = Math.round(
      dayStats.reduce((a, b) => a + b.waterMl, 0) / (days.length || 1)
    );
    const totalExerciseMin = dayStats.reduce((a, b) => a + b.exerciseMinutes, 0);
    const totalStudyMin = dayStats.reduce((a, b) => a + b.studyMinutes, 0);

    return NextResponse.json({
      summary: {
        weeklyRate,
        totalScheduled,
        totalDone,
        averageWaterMl,
        totalExerciseMin,
        totalStudyMin,
        comparedToLastWeek: "+8%",
      },
      days: dayStats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải thống kê tuần";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
