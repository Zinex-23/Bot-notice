import { NextResponse } from "next/server";
import { dispatchDueNotifications } from "@/lib/cron/dispatcher";
import { getVietnamDateString } from "@/lib/schedule/engine";
import { prisma } from "@/lib/prisma";
import { syncDailyOccurrences } from "@/lib/schedule/service";

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

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
    // Quick auto-sync today's occurrences for any newly added schedules
    const todayStr = getVietnamDateString();
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const u of users) {
      await syncDailyOccurrences(u.id, todayStr);
    }

    // Dispatch all due notifications
    const dispatchResults = await dispatchDueNotifications();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...dispatchResults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi gửi thông báo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow GET for easy browser / health check ping testing
export async function GET(request: Request) {
  return POST(request);
}
