import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { seedInitialScheduleForUser } from "@/lib/schedule/seed";

export async function POST(request: Request) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json().catch(() => ({}));
    const force = Boolean(body.force);

    await seedInitialScheduleForUser(user.id, force);

    return NextResponse.json({
      success: true,
      message: "Đã nạp lịch trình mẫu thành công!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi nạp dữ liệu mẫu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
