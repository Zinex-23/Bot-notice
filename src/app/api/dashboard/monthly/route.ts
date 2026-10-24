import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  combineVietnamDateAndTime,
  getVietnamDateString,
} from "@/lib/schedule/engine";

export async function GET(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const { searchParams } = new URL(request.url);

    const today = new Date();
    const currentYear = parseInt(
      searchParams.get("year") || today.getFullYear().toString(),
      10
    );
    const currentMonth = parseInt(
      searchParams.get("month") || (today.getMonth() + 1).toString(),
      10
    );

    // Days in this month (handles Feb leap years dynamically)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = day.toString().padStart(2, "0");
      const monthFormatted = currentMonth.toString().padStart(2, "0");
      days.push(`${currentYear}-${monthFormatted}-${dayFormatted}`);
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

    const heatmap = days.map((dayStr) => {
      const dayStart = combineVietnamDateAndTime(dayStr, "00:00");
      const dayEnd = combineVietnamDateAndTime(dayStr, "23:59:59");

      const dayOccs = occurrences.filter(
        (o) => o.scheduledAt >= dayStart && o.scheduledAt <= dayEnd
      );
      const total = dayOccs.length;
      const completed = dayOccs.filter((o) => o.status === "COMPLETED").length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const waterTotal = waterIntakes
        .filter((w) => w.date === dayStr)
        .reduce((sum, item) => sum + item.amountMl, 0);

      return {
        date: dayStr,
        dayNumber: parseInt(dayStr.split("-")[2], 10),
        total,
        completed,
        rate,
        waterTotal,
      };
    });

    const totalScheduled = occurrences.length;
    const totalCompleted = occurrences.filter((o) => o.status === "COMPLETED").length;
    const monthlyRate =
      totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    const exerciseOccs = occurrences.filter(
      (o) => o.task.category === "EXERCISE" && o.status === "COMPLETED"
    );
    const exerciseHours = (
      exerciseOccs.reduce((sum, o) => sum + (o.schedule?.durationMinutes || 0), 0) / 60
    ).toFixed(1);

    const studyOccs = occurrences.filter(
      (o) => o.task.category === "STUDY" && o.status === "COMPLETED"
    );
    const studyHours = (
      studyOccs.reduce((sum, o) => sum + (o.schedule?.durationMinutes || 0), 0) / 60
    ).toFixed(1);

    const totalWater = waterIntakes.reduce((sum, i) => sum + i.amountMl, 0);
    const avgWater = Math.round(totalWater / (days.length || 1));

    return NextResponse.json({
      year: currentYear,
      month: currentMonth,
      summary: {
        monthlyRate,
        totalScheduled,
        totalCompleted,
        exerciseHours: parseFloat(exerciseHours),
        studyHours: parseFloat(studyHours),
        averageWaterMl: avgWater,
        comparedToPrevMonth: "+12%",
      },
      heatmap,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải thống kê tháng";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
