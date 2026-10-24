import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getVietnamDateString } from "@/lib/schedule/engine";

export async function POST(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    const amountMl = parseInt(body.amountMl || 250, 10);
    const todayStr = getVietnamDateString();

    const entry = await prisma.waterIntake.create({
      data: {
        userId: user.id,
        amountMl,
        date: todayStr,
        source: "WEB",
      },
    });

    const logs = await prisma.waterIntake.findMany({
      where: { userId: user.id, date: todayStr },
    });
    const totalConsumed = logs.reduce((acc, curr) => acc + curr.amountMl, 0);

    return NextResponse.json({
      success: true,
      entry,
      totalConsumed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi ghi nhận lượng nước";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
