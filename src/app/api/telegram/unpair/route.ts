import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    await prisma.telegramConnection.updateMany({
      where: { userId: user.id },
      data: {
        chatId: null,
        username: null,
        firstName: null,
        pairedAt: null,
        pairingCode: null,
        pairingCodeExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi hủy kết nối Telegram";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
