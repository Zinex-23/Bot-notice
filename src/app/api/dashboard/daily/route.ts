import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getVietnamDateString } from "@/lib/schedule/engine";

export async function GET(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || getVietnamDateString();

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    const occurrences = await prisma.taskOccurrence.findMany({
      where: {
        task: { userId: user.id, deletedAt: null },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { task: true, schedule: true, completion: true },
      orderBy: { scheduledAt: "asc" },
    });

    const total = occurrences.length;
    const completed = occurrences.filter((o) => o.status === "COMPLETED").length;
    const pending = occurrences.filter((o) => o.status === "PENDING" || o.status === "SNOOZED").length;
    const skipped = occurrences.filter((o) => o.status === "SKIPPED").length;
    const missed = occurrences.filter((o) => o.status === "MISSED").length;

    const waterIntakes = await prisma.waterIntake.findMany({
      where: { userId: user.id, date: dateStr },
    });
    const waterTotal = waterIntakes.reduce((a, b) => a + b.amountMl, 0);

    return NextResponse.json({
      date: dateStr,
      metrics: {
        total,
        completed,
        pending,
        skipped,
        missed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        waterTotal,
        waterTarget: user.settings?.waterTargetMl || 1500,
      },
      occurrences,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải thống kê ngày";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
