import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram/bot";

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
      if (headerSecret !== webhookSecret) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    return await webhookCallback(bot, "std/http")(req);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
