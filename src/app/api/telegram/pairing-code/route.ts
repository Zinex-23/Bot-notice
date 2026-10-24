import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const conn = await prisma.telegramConnection.upsert({
      where: { userId: user.id },
      update: {
        pairingCode: code,
        pairingCodeExpiresAt: expiresAt,
      },
      create: {
        userId: user.id,
        pairingCode: code,
        pairingCodeExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tạo mã kết nối";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
