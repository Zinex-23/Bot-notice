import { NextResponse } from "next/server";
import { bot } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  try {
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      process.env.VERCEL_URL;
    const protocol = request.headers.get("x-forwarded-proto") || "https";

    let baseUrl = process.env.APP_BASE_URL;

    if (!baseUrl || baseUrl.includes("localhost")) {
      if (host && !host.includes("localhost")) {
        baseUrl = host.startsWith("http") ? host : `${protocol}://${host}`;
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
    }

    if (!baseUrl || baseUrl.includes("localhost")) {
      return NextResponse.json(
        {
          error:
            "Không thể xác định tên miền công khai. Vui lòng cấu hình biến APP_BASE_URL (ví dụ https://bot-notice.vercel.app) trên Vercel.",
        },
        { status: 400 }
      );
    }

    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    await bot.api.setWebhook(webhookUrl, {
      secret_token: secretToken || undefined,
      drop_pending_updates: false,
    });

    const info = await bot.api.getWebhookInfo();

    return NextResponse.json({
      success: true,
      message: `Đã kết nối Webhook Telegram thành công tới: ${webhookUrl}`,
      webhookUrl,
      info,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cài đặt Webhook thất bại";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
