import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    let config = await prisma.reportConfiguration.findUnique({
      where: { userId: user.id },
    });

    if (!config) {
      config = await prisma.reportConfiguration.create({
        data: {
          userId: user.id,
          dailyEnabled: true,
          dailyTime: "22:00",
          dailyWithImage: true,
          dailyUnfinished: true,
          weeklyEnabled: true,
          weeklyDay: 0,
          weeklyTime: "21:45",
          monthlyEnabled: true,
          monthlyTime: "22:15",
        },
      });
    }

    return NextResponse.json(config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải cấu hình báo cáo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    const config = await prisma.reportConfiguration.upsert({
      where: { userId: user.id },
      update: {
        dailyEnabled: body.dailyEnabled,
        dailyTime: body.dailyTime,
        dailyWithImage: body.dailyWithImage,
        dailyUnfinished: body.dailyUnfinished,
        weeklyEnabled: body.weeklyEnabled,
        weeklyDay: body.weeklyDay,
        weeklyTime: body.weeklyTime,
        weeklyWithImage: body.weeklyWithImage,
        monthlyEnabled: body.monthlyEnabled,
        monthlyTime: body.monthlyTime,
        monthlyWithImage: body.monthlyWithImage,
      },
      create: {
        userId: user.id,
        ...body,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi lưu cấu hình báo cáo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
