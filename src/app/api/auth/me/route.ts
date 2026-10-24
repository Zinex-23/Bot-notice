import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      telegramConnected: !!user.telegramConnection?.chatId,
      telegramUsername: user.telegramConnection?.username,
      isPaused: user.telegramConnection?.isPaused,
    },
  });
}
