import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    let settings = await prisma.applicationSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.applicationSettings.create({
        data: {
          userId: user.id,
          waterTargetMl: 1500,
          timezone: "Asia/Ho_Chi_Minh",
          theme: "system",
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      settings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải cài đặt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    const settings = await prisma.applicationSettings.upsert({
      where: { userId: user.id },
      update: {
        waterTargetMl: body.waterTargetMl !== undefined ? Number(body.waterTargetMl) : undefined,
        theme: body.theme,
        timezone: body.timezone,
      },
      create: {
        userId: user.id,
        waterTargetMl: body.waterTargetMl ? Number(body.waterTargetMl) : 1500,
        theme: body.theme || "system",
        timezone: body.timezone || "Asia/Ho_Chi_Minh",
      },
    });

    if (body.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi cập nhật cài đặt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
