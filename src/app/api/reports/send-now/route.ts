import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { sendDailyReport } from "@/lib/cron/dispatcher";

export async function POST() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const telegram = user.telegramConnection;

    if (!telegram?.chatId || !telegram.isActive) {
      return NextResponse.json(
        {
          error:
            "Chưa kết nối Telegram hoặc tài khoản đang tạm dừng. Vui lòng vào Cài đặt -> Kết nối Telegram trước khi gửi báo cáo.",
        },
        { status: 400 }
      );
    }

    await sendDailyReport(user.id, telegram.chatId);

    return NextResponse.json({
      success: true,
      message: `Đã gửi báo cáo tổng kết tới Telegram (@${telegram.username || telegram.firstName || telegram.chatId}) thành công!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gửi báo cáo thất bại";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
