import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "../prisma";
import { completeTaskOccurrence, snoozeOccurrence } from "../schedule/service";
import { getVietnamDateString, getVietnamTimeComponents } from "../schedule/engine";

const token = process.env.TELEGRAM_BOT_TOKEN || "";

export const bot = new Bot(token);

/**
 * Helper to get or verify linked user from Telegram chatId
 */
export async function getLinkedUser(chatId: string) {
  const connection = await prisma.telegramConnection.findFirst({
    where: { chatId, isActive: true },
    include: {
      user: {
        include: {
          settings: true,
          reportConfiguration: true,
        },
      },
    },
  });

  return connection;
}

// ---------------------------------------------------------
// Commands
// ---------------------------------------------------------

bot.command("start", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name || "bạn";
  const text = ctx.message?.text || "";
  const parts = text.split(" ");
  const code = parts[1]?.trim();

  // If a pairing code was provided: /start 123456
  if (code) {
    const connection = await prisma.telegramConnection.findFirst({
      where: {
        pairingCode: code,
        pairingCodeExpiresAt: { gte: new Date() },
      },
    });

    if (connection) {
      await prisma.telegramConnection.update({
        where: { id: connection.id },
        data: {
          chatId,
          username,
          firstName,
          pairedAt: new Date(),
          pairingCode: null,
          pairingCodeExpiresAt: null,
          isActive: true,
          isPaused: false,
        },
      });

      return ctx.reply(
        `🎉 Chúc mừng ${firstName}! Kết nối Telegram với DailyFlow thành công.\n\n` +
          `Từ bây giờ, tôi sẽ gửi thông báo lịch nhắc và báo cáo tự động cho bạn tại đây.\n\n` +
          `👉 Gõ /today để xem lịch trình hôm nay.\n` +
          `👉 Gõ /help để xem danh sách lệnh hữu ích.`
      );
    } else {
      return ctx.reply(
        `❌ Mã kết nối "${code}" không hợp lệ hoặc đã hết hạn (15 phút).\n\n` +
          `Vui lòng truy cập trang Cài đặt trên Web Dashboard DailyFlow để lấy mã kết nối mới.`
      );
    }
  }

  // Check if already connected
  const existing = await getLinkedUser(chatId);
  if (existing) {
    return ctx.reply(
      `👋 Chào mừng trở lại, ${existing.firstName || firstName}!\n\n` +
        `DailyFlow đang hoạt động bình thường.\n\n` +
        `• /today - Xem lịch trình hôm nay\n` +
        `• /water - Trạng thái uống nước\n` +
        `• /report - Báo cáo tổng kết\n` +
        `• /dashboard - Mở website điều khiển\n` +
        `• /help - Hướng dẫn chi tiết`
    );
  }

  return ctx.reply(
    `👋 Chào bạn đến với **DailyFlow Bot**!\n\n` +
      `Để bắt đầu nhận thông báo nhắc việc và đồng bộ lịch trình cá nhân:\n` +
      `1. Đăng nhập vào website DailyFlow\n` +
      `2. Vào mục **Cài đặt** -> **Kết nối Telegram**\n` +
      `3. Nhấn **"Lấy mã kết nối"** và gửi mã 6 số theo cú pháp:\n` +
      `   \`/start <mã_6_số>\`\n\n` +
      `Ví dụ: \`/start 839201\``,
    { parse_mode: "Markdown" }
  );
});

bot.command("help", async (ctx) => {
  return ctx.reply(
    `📋 **DANH SÁCH LỆNH DAILYFLOW**\n\n` +
      `• /today - Lịch trình và trạng thái các hoạt động hôm nay\n` +
      `• /done - Đánh dấu hoàn thành nhanh công việc\n` +
      `• /pending - Danh sách việc chưa hoàn thành\n` +
      `• /water - Tiến độ uống nước & ghi nhận lượng nước\n` +
      `• /report - Xem báo cáo tổng kết ngày hôm nay\n` +
      `• /week - Thống kê năng suất tuần này\n` +
      `• /month - Thống kê năng suất tháng này\n` +
      `• /dashboard - Đường link mở Web Dashboard\n` +
      `• /settings - Xem trạng thái thông báo và tài khoản\n` +
      `• /pause - Tạm dừng nhận thông báo nhắc nhở\n` +
      `• /resume - Tiếp tục nhận thông báo nhắc nhở\n\n` +
      `💡 Bạn có thể bấm trực tiếp các nút dưới tin nhắn nhắc nhở để Hoàn thành hoặc Nhắc lại!`,
    { parse_mode: "Markdown" }
  );
});

bot.command("today", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) {
    return ctx.reply("⚠️ Bạn chưa liên kết tài khoản. Gõ /start để được hướng dẫn kết nối.");
  }

  const todayStr = getVietnamDateString();
  const occurrences = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId: conn.userId, deletedAt: null },
      scheduledAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    include: { task: true, schedule: true },
    orderBy: { scheduledAt: "asc" },
  });

  if (occurrences.length === 0) {
    return ctx.reply(`📅 **HÔM NAY (${todayStr})**\n\nChưa có hoạt động nào được lên lịch hôm nay!`, {
      parse_mode: "Markdown",
    });
  }

  let text = `📅 **LỊCH TRÌNH HÔM NAY (${todayStr})**\n\n`;

  const statusIcons: Record<string, string> = {
    COMPLETED: "✅",
    PENDING: "⏳",
    SNOOZED: "⏰",
    SKIPPED: "⏭",
    MISSED: "❌",
  };

  occurrences.forEach((occ, idx) => {
    const icon = statusIcons[occ.status] || "🔹";
    const time = occ.schedule?.startTime || "00:00";
    const target = occ.task.targetValue
      ? ` (${occ.task.targetValue} ${occ.task.targetUnit || ""})`
      : "";
    text += `${idx + 1}. ${icon} \`${time}\` **${occ.task.title}**${target}\n`;
  });

  const total = occurrences.length;
  const done = occurrences.filter((o) => o.status === "COMPLETED").length;
  const pct = Math.round((done / total) * 100);

  text += `\n📊 Tiến độ: **${done}/${total}** (${pct}%)`;

  const keyboard = new InlineKeyboard()
    .url("🌐 Mở Lịch 24 Giờ", `${process.env.APP_BASE_URL || "http://localhost:3000"}/planner`)
    .text("🔄 Làm mới", "refresh_today");

  return ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
});

bot.command("pending", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.");

  const pending = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId: conn.userId, deletedAt: null },
      status: { in: ["PENDING", "SNOOZED"] },
      scheduledAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    include: { task: true, schedule: true },
    orderBy: { scheduledAt: "asc" },
  });

  if (pending.length === 0) {
    return ctx.reply("🎉 Tuyệt vời! Bạn đã hoàn thành tất cả công việc hôm nay.");
  }

  let text = `⏳ **CÁC VIỆC CẦN HOÀN THÀNH HÔM NAY (${pending.length})**:\n\n`;
  const keyboard = new InlineKeyboard();

  pending.forEach((occ, idx) => {
    const time = occ.schedule?.startTime || "00:00";
    text += `${idx + 1}. ⏰ \`${time}\` **${occ.task.title}**\n`;
    keyboard.text(`✅ Xong: ${occ.task.title.substring(0, 15)}`, `done:${occ.id}`).row();
  });

  return ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
});

bot.command("water", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.");

  const todayStr = getVietnamDateString();
  const intakes = await prisma.waterIntake.findMany({
    where: { userId: conn.userId, date: todayStr },
  });

  const totalConsumed = intakes.reduce((acc, curr) => acc + curr.amountMl, 0);
  const target = conn.user.settings?.waterTargetMl || 1500;
  const pct = Math.min(100, Math.round((totalConsumed / target) * 100));

  const progressBar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));

  const text =
    `💧 **TIẾN ĐỘ UỐNG NƯỚC HÔM NAY**\n\n` +
    `📊 Đã uống: **${totalConsumed.toLocaleString()} / ${target.toLocaleString()} ml** (${pct}%)\n` +
    `[${progressBar}]\n\n` +
    `🥛 Bấm nút dưới đây để ghi nhận thêm nước:`;

  const keyboard = new InlineKeyboard()
    .text("🥛 +250 ml", "water_add:250")
    .text("🍶 +500 ml", "water_add:500")
    .row()
    .url("📊 Xem chi tiết", `${process.env.APP_BASE_URL || "http://localhost:3000"}/water`);

  return ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
});

bot.command("report", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.");

  const todayStr = getVietnamDateString();
  const occurrences = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId: conn.userId, deletedAt: null },
      scheduledAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    include: { task: true, schedule: true },
  });

  const total = occurrences.length;
  const completed = occurrences.filter((o) => o.status === "COMPLETED").length;
  const waterIntakes = await prisma.waterIntake.findMany({
    where: { userId: conn.userId, date: todayStr },
  });
  const waterTotal = waterIntakes.reduce((acc, curr) => acc + curr.amountMl, 0);
  const waterTarget = conn.user.settings?.waterTargetMl || 1500;

  const exerciseOccs = occurrences.filter(
    (o) => o.task.category === "EXERCISE" && o.status === "COMPLETED"
  );
  const exerciseMin = exerciseOccs.reduce((acc, o) => acc + (o.schedule?.durationMinutes || 0), 0);

  const studyOccs = occurrences.filter(
    (o) => o.task.category === "STUDY" && o.status === "COMPLETED"
  );
  const studyMin = studyOccs.reduce((acc, o) => acc + (o.schedule?.durationMinutes || 0), 0);

  const text =
    `📊 **TỔNG KẾT HÔM NAY (${todayStr})**\n\n` +
    `✅ Hoàn thành: **${completed}/${total}** (${total > 0 ? Math.round((completed / total) * 100) : 0}%)\n` +
    `💧 Uống nước: **${waterTotal.toLocaleString()} / ${waterTarget.toLocaleString()} ml**\n` +
    `🏋️ Tập thể dục: **${exerciseMin} phút**\n` +
    `📚 Học tập: **${studyMin} phút**\n\n` +
    `🔥 Tiếp tục duy trì phong độ nhé!`;

  const keyboard = new InlineKeyboard().url(
    "📊 Mở Dashboard",
    `${process.env.APP_BASE_URL || "http://localhost:3000"}/overview`
  );

  return ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
});

bot.command("dashboard", async (ctx) => {
  const url = process.env.APP_BASE_URL || "http://localhost:3000";
  const keyboard = new InlineKeyboard().url("🚀 Mở DailyFlow Web", url);
  return ctx.reply(
    `🌐 **BẢNG ĐIỀU KHIỂN DAILYFLOW**\n\nTruy cập trung tâm điều khiển của bạn tại:\n${url}`,
    {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    }
  );
});

bot.command("pause", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.");

  await prisma.telegramConnection.update({
    where: { id: conn.id },
    data: { isPaused: true },
  });

  return ctx.reply("⏸ Đã tạm dừng nhận thông báo nhắc nhở. Gõ /resume khi bạn muốn bật lại.");
});

bot.command("resume", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.");

  await prisma.telegramConnection.update({
    where: { id: conn.id },
    data: { isPaused: false },
  });

  return ctx.reply("▶️ Đã bật lại thông báo nhắc nhở từ DailyFlow!");
});

// ---------------------------------------------------------
// Inline Keyboard Callback Handlers
// ---------------------------------------------------------

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat?.id.toString();
  if (!chatId) return ctx.answerCallbackQuery();

  const conn = await getLinkedUser(chatId);
  if (!conn) {
    return ctx.answerCallbackQuery({
      text: "⚠️ Tài khoản chưa được liên kết.",
      show_alert: true,
    });
  }

  // Handle Done: `done:<occurrenceId>`
  if (data.startsWith("done:")) {
    const occId = data.replace("done:", "");
    try {
      const result = await completeTaskOccurrence(conn.userId, occId, undefined, "TELEGRAM");
      await ctx.answerCallbackQuery({ text: "✅ Đã ghi nhận hoàn thành!" });

      // Edit original message to reflect completion
      const originalText = ctx.callbackQuery.message?.text || "";
      const updatedText =
        originalText +
        `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ **ĐÃ HOÀN THÀNH** lúc ${new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`;

      try {
        await ctx.editMessageText(updatedText, {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard().url(
            "📊 Mở DailyFlow",
            process.env.APP_BASE_URL || "http://localhost:3000"
          ),
        });
      } catch {
        // Message might be unchanged or edited already
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      await ctx.answerCallbackQuery({ text: `❌ ${errorMsg}`, show_alert: true });
    }
    return;
  }

  // Handle Snooze: `snooze:<occurrenceId>`
  if (data.startsWith("snooze:")) {
    const occId = data.replace("snooze:", "");
    try {
      await snoozeOccurrence(conn.userId, occId, 15);
      await ctx.answerCallbackQuery({ text: "⏰ Đã hẹn nhắc lại sau 15 phút!" });

      const originalText = ctx.callbackQuery.message?.text || "";
      try {
        await ctx.editMessageText(
          originalText + `\n\n━━━━━━━━━━━━━━━━━━━━\n⏰ **SẼ NHẮC LẠI SAU 15 PHÚT**`,
          { parse_mode: "Markdown" }
        );
      } catch {}
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      await ctx.answerCallbackQuery({ text: `❌ ${errorMsg}`, show_alert: true });
    }
    return;
  }

  // Handle Skip: `skip:<occurrenceId>`
  if (data.startsWith("skip:")) {
    const occId = data.replace("skip:", "");
    try {
      await prisma.taskOccurrence.update({
        where: { id: occId },
        data: { status: "SKIPPED" },
      });
      await prisma.notificationJob.updateMany({
        where: { occurrenceId: occId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      await ctx.answerCallbackQuery({ text: "⏭ Đã bỏ qua nhắc nhở lần này." });
      const originalText = ctx.callbackQuery.message?.text || "";
      try {
        await ctx.editMessageText(originalText + `\n\n━━━━━━━━━━━━━━━━━━━━\n⏭ **ĐÃ BỎ QUA**`, {
          parse_mode: "Markdown",
        });
      } catch {}
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      await ctx.answerCallbackQuery({ text: `❌ ${errorMsg}`, show_alert: true });
    }
    return;
  }

  // Handle Quick Water Log: `water_add:<amount>`
  if (data.startsWith("water_add:")) {
    const amount = parseInt(data.replace("water_add:", ""), 10) || 250;
    const todayStr = getVietnamDateString();
    await prisma.waterIntake.create({
      data: {
        userId: conn.userId,
        amountMl: amount,
        date: todayStr,
        source: "TELEGRAM",
      },
    });

    const intakes = await prisma.waterIntake.findMany({
      where: { userId: conn.userId, date: todayStr },
    });
    const total = intakes.reduce((a, b) => a + b.amountMl, 0);
    const target = conn.user.settings?.waterTargetMl || 1500;

    await ctx.answerCallbackQuery({
      text: `💧 +${amount} ml thành công! Hôm nay: ${total}/${target} ml`,
    });
    return;
  }

  await ctx.answerCallbackQuery();
});
