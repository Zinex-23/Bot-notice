import { NextResponse } from "next/server";
import { bot } from "@/lib/telegram/bot";

export async function POST() {
  try {
    const baseUrl = process.env.APP_BASE_URL;
    if (!baseUrl || baseUrl.includes("localhost")) {
      return NextResponse.json(
        {
          error:
            "APP_BASE_URL phải là tên miền công khai (ví dụ https://your-app.vercel.app), không thể dùng localhost cho Telegram Webhook.",
        },
        { status: 400 }
      );
    }

    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    await bot.api.setWebhook(webhookUrl, {
      secret_token: secretToken || undefined,
      drop_pending_updates: true,
    });

    const info = await bot.api.getWebhookInfo();

    return NextResponse.json({
      success: true,
      webhookUrl,
      info,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cài đặt Webhook thất bại";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
