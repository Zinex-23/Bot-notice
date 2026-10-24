import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getVietnamDateString } from "@/lib/schedule/engine";

export async function GET(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || getVietnamDateString();

    const logs = await prisma.waterIntake.findMany({
      where: { userId: user.id, date: dateStr },
      orderBy: { loggedAt: "desc" },
    });

    const totalConsumed = logs.reduce((acc, curr) => acc + curr.amountMl, 0);
    const target = user.settings?.waterTargetMl || 1500;
    const percentage = Math.min(100, Math.round((totalConsumed / target) * 100));

    return NextResponse.json({
      date: dateStr,
      totalConsumed,
      target,
      percentage,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải dữ liệu uống nước";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
