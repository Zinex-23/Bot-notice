import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram/bot";

// Reuse the webhook callback adapter across serverless invocations
const handleUpdate = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: 25000,
  onTimeout: "return",
});

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
      if (headerSecret && headerSecret !== webhookSecret) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    return await handleUpdate(req);
  } catch (err) {
    console.error("Telegram webhook handler error:", err);
    return new Response("OK", { status: 200 });
  }
}

export async function GET() {
  return new Response("DailyFlow Telegram Webhook is active and healthy.", {
    status: 200,
  });
}
