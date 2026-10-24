import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    const conn = user.telegramConnection;
    const isPaired = Boolean(conn?.chatId);

    return NextResponse.json({
      isPaired,
      username: conn?.username || null,
      firstName: conn?.firstName || null,
      pairedAt: conn?.pairedAt || null,
      isActive: conn?.isActive ?? true,
      isPaused: conn?.isPaused ?? false,
      pairingCode: conn?.pairingCode || null,
      pairingCodeExpiresAt: conn?.pairingCodeExpiresAt || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi kiểm tra Telegram";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
