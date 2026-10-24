import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { getVietnamDateString } from "@/lib/schedule/engine";
import { createScheduleItem, getPlannerDay } from "@/lib/schedule/service";
import { seedInitialScheduleForUser } from "@/lib/schedule/seed";

export async function GET(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    // Auto seed default schedule if first time
    if (!user.settings?.isInitialized) {
      await seedInitialScheduleForUser(user.id);
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || getVietnamDateString();

    const plannerData = await getPlannerDay(user.id, dateStr);
    return NextResponse.json(plannerData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải lịch trình";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    if (!body.title || !body.startTime) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên hoạt động và giờ nhắc." },
        { status: 400 }
      );
    }

    const task = await createScheduleItem(user.id, body);
    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tạo lịch nhắc";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
