import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVietnamDateString } from "@/lib/schedule/engine";
import { syncDailyOccurrences } from "@/lib/schedule/service";

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // If not configured, allow local testing

  const authHeader = request.headers.get("authorization");
  const customHeader = request.headers.get("x-cron-secret");

  if (customHeader === cronSecret) return true;
  if (authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStr = getVietnamDateString();
    const users = await prisma.user.findMany({ select: { id: true } });

    let synced = 0;
    for (const u of users) {
      await syncDailyOccurrences(u.id, todayStr);
      synced++;
    }

    return NextResponse.json({
      success: true,
      action: "prepare-day",
      date: todayStr,
      usersProcessed: synced,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi chuẩn bị lịch trong ngày";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
