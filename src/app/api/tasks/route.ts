import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createScheduleItem } from "@/lib/schedule/service";

export async function GET(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        category: category ? category : undefined,
      },
      include: {
        schedules: {
          where: { isDeleted: false },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải danh sách công việc";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    const task = await createScheduleItem(user.id, body);
    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tạo công việc";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
