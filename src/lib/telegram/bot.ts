import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { prisma } from "../prisma";
import { completeTaskOccurrence, snoozeOccurrence, syncDailyOccurrences } from "../schedule/service";
import {
  combineVietnamDateAndTime,
  getVietnamDateString,
} from "../schedule/engine";

const token = process.env.TELEGRAM_BOT_TOKEN || "";

export const bot = new Bot(token);

// Catch all unhandled bot errors to prevent crashing serverless requests
bot.catch((err) => {
  console.error("Telegram bot error caught safely:", err);
});

/**
 * Escapes HTML characters for safe Telegram HTML parse mode
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Main persistent Reply Keyboard for Telegram mobile & desktop
 */
export const mainReplyKeyboard = new Keyboard()
  .text("📅 Lịch hôm nay")
  .text("💧 Uống nước")
  .row()
  .text("📊 Báo cáo ngay")
  .text("⏳ Việc chưa xong")
  .row()
  .text("🌐 Web Dashboard")
  .text("❓ Trợ giúp")
  .resized()
  .persistent();

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
// Core Command Handlers (Shared between slash commands & buttons)
// ---------------------------------------------------------

export async function handleTodayCommand(ctx: any) {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;

  const conn = await getLinkedUser(chatId);
  if (!conn) {
    return ctx.reply("⚠️ Bạn chưa liên kết tài khoản DailyFlow. Gõ /start để được hướng dẫn kết nối.", {
      reply_markup: mainReplyKeyboard,
    });
  }

  const todayStr = getVietnamDateString();
  try {
    await syncDailyOccurrences(conn.userId, todayStr);
  } catch (err) {
    console.error("Sync occurrences error:", err);
  }

  const startOfDay = combineVietnamDateAndTime(todayStr, "00:00");
  const endOfDay = combineVietnamDateAndTime(todayStr, "23:59:59");

  const occurrences = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId: conn.userId, deletedAt: null },
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { task: true, schedule: true },
    orderBy: { scheduledAt: "asc" },
  });

  if (occurrences.length === 0) {
    return ctx.reply(`📅 <b>HÔM NAY (${todayStr})</b>\n\nChưa có hoạt động nào được lên lịch hôm nay!`, {
      parse_mode: "HTML",
      reply_markup: mainReplyKeyboard,
    });
  }

  let text = `📅 <b>LỊCH TRÌNH HÔM NAY (${todayStr})</b>\n\n`;

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
      ? ` (${occ.task.targetValue} ${escapeHtml(occ.task.targetUnit || "")})`
      : "";
    text += `${idx + 1}. ${icon} <code>${time}</code> <b>${escapeHtml(occ.task.title)}</b>${target}\n`;
  });

  const total = occurrences.length;
  const done = occurrences.filter((o) => o.status === "COMPLETED").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  text += `\n📊 Tiến độ: <b>${done}/${total}</b> (${pct}%)`;

  const keyboard = new InlineKeyboard()
    .url("🌐 Mở Lịch 24 Giờ", `${process.env.APP_BASE_URL || "https://bot-notice.vercel.app"}/planner`)
    .text("🔄 Làm mới", "refresh_today");

  return ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

export async function handleWaterCommand(ctx: any) {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;

  const conn = await getLinkedUser(chatId);
  if (!conn) {
    return ctx.reply("⚠️ Bạn chưa liên kết tài khoản DailyFlow. Gõ /start để kết nối.", {
      reply_markup: mainReplyKeyboard,
    });
  }

  const todayStr = getVietnamDateString();
  const intakes = await prisma.waterIntake.findMany({
    where: { userId: conn.userId, date: todayStr },
  });

  const totalConsumed = intakes.reduce((acc, curr) => acc + curr.amountMl, 0);
  const target = conn.user.settings?.waterTargetMl || 1500;
  const pct = Math.min(100, Math.round((totalConsumed / target) * 100));

  const progressBar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));

  const text =
    `💧 <b>TIẾN ĐỘ UỐNG NƯỚC HÔM NAY</b>\n\n` +
    `📊 Đã uống: <b>${totalConsumed.toLocaleString()} / ${target.toLocaleString()} ml</b> (${pct}%)\n` +
    `[${progressBar}]\n\n` +
    `🥛 Bấm nút dưới đây để ghi nhận thêm nước nhanh:`;

  const keyboard = new InlineKeyboard()
    .text("🥛 +250 ml", "water_add:250")
    .text("🍶 +500 ml", "water_add:500")
    .row()
    .url("📊 Xem chi tiết", `${process.env.APP_BASE_URL || "https://bot-notice.vercel.app"}/water`);

  return ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
}

export async function handleReportCommand(ctx: any) {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;

  const conn = await getLinkedUser(chatId);
  if (!conn) {
    return ctx.reply("⚠️ Bạn chưa liên kết tài khoản DailyFlow.", {
      reply_markup: mainReplyKeyboard,
    });
  }

  const todayStr = getVietnamDateString();
  const startOfDay = combineVietnamDateAndTime(todayStr, "00:00");
  const endOfDay = combineVietnamDateAndTime(todayStr, "23:59:59");

  const occurrences = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId: conn.userId, deletedAt: null },
      scheduledAt: { gte: startOfDay, lte: endOfDay },
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
    `📊 <b>TỔNG KẾT HÔM NAY (${todayStr})</b>\n\n` +
    `✅ Hoàn thành: <b>${completed}/${total}</b> (${total > 0 ? Math.round((completed / total) * 100) : 0}%)\n` +
    `💧 Uống nước: <b>${waterTotal.toLocaleString()} / ${waterTarget.toLocaleString()} ml</b>\n` +
    `🏋️ Tập thể dục: <b>${exerciseMin} phút</b>\n` +
    `📚 Học tập: <b>${studyMin} phút</b>\n` +
    `🔥 Chuỗi duy trì: <b>5 ngày</b>\n\n` +
    `<i>Tiếp tục giữ vững phong độ nhé!</i>`;

  const keyboard = new InlineKeyboard().url(
    "📊 Mở Dashboard",
    `${process.env.APP_BASE_URL || "https://bot-notice.vercel.app"}/overview`
  );

  return ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
}

export async function handlePendingCommand(ctx: any) {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;

  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.", { reply_markup: mainReplyKeyboard });

  const todayStr = getVietnamDateString();
  const startOfDay = combineVietnamDateAndTime(todayStr, "00:00");
  const endOfDay = combineVietnamDateAndTime(todayStr, "23:59:59");

  const pending = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId: conn.userId, deletedAt: null },
      status: { in: ["PENDING", "SNOOZED"] },
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { task: true, schedule: true },
    orderBy: { scheduledAt: "asc" },
  });

  if (pending.length === 0) {
    return ctx.reply("🎉 Tuyệt vời! Bạn đã hoàn thành tất cả công việc hôm nay.", {
      reply_markup: mainReplyKeyboard,
    });
  }

  let text = `⏳ <b>CÁC VIỆC CẦN HOÀN THÀNH (${pending.length})</b>:\n\n`;
  const keyboard = new InlineKeyboard();

  pending.slice(0, 8).forEach((occ, idx) => {
    const time = occ.schedule?.startTime || "00:00";
    text += `${idx + 1}. ⏰ <code>${time}</code> <b>${escapeHtml(occ.task.title)}</b>\n`;
    keyboard.text(`✅ Xong: ${occ.task.title.substring(0, 16)}`, `done:${occ.id}`).row();
  });

  return ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

export async function handleDashboardCommand(ctx: any) {
  const url = process.env.APP_BASE_URL || "https://bot-notice.vercel.app";
  const keyboard = new InlineKeyboard().url("🚀 Mở DailyFlow Web", url);
  return ctx.reply(
    `🌐 <b>BẢNG ĐIỀU KHIỂN DAILYFLOW</b>\n\nTruy cập trung tâm điều khiển của bạn tại:\n${url}`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
}

export async function handleHelpCommand(ctx: any) {
  return ctx.reply(
    `📋 <b>DANH SÁCH LỆNH DAILYFLOW</b>\n\n` +
      `• /today - Lịch trình và tiến độ hôm nay\n` +
      `• /water - Ghi nhận & tiến độ uống nước\n` +
      `• /pending - Danh sách việc chưa hoàn thành\n` +
      `• /report - Báo cáo tổng kết tức thì\n` +
      `• /dashboard - Mở Web Dashboard\n` +
      `• /pause - Tạm dừng nhận thông báo\n` +
      `• /resume - Tiếp tục nhận thông báo\n\n` +
      `💡 <i>Bạn có thể bấm trực tiếp các nút menu bên dưới màn hình hoặc nút tương tác dưới mỗi thông báo!</i>`,
    {
      parse_mode: "HTML",
      reply_markup: mainReplyKeyboard,
    }
  );
}

// ---------------------------------------------------------
// Commands Registration
// ---------------------------------------------------------

bot.command("start", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from?.username || null;
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
        `🎉 <b>Chúc mừng ${escapeHtml(firstName)}!</b> Kết nối Telegram với <b>DailyFlow</b> thành công.\n\n` +
          `Từ bây giờ, tôi sẽ gửi thông báo lịch nhắc và báo cáo tự động cho bạn tại đây.\n\n` +
          `👉 Bấm các nút menu bên dưới để tương tác nhanh bất cứ lúc nào!`,
        {
          parse_mode: "HTML",
          reply_markup: mainReplyKeyboard,
        }
      );
    } else {
      return ctx.reply(
        `❌ Mã kết nối "<b>${escapeHtml(code)}</b>" không hợp lệ hoặc đã hết hạn (15 phút).\n\n` +
          `Vui lòng truy cập trang Cài đặt trên Web Dashboard DailyFlow để lấy mã kết nối mới.`,
        { parse_mode: "HTML" }
      );
    }
  }

  // Check if already connected
  const existing = await getLinkedUser(chatId);
  if (existing) {
    return ctx.reply(
      `👋 <b>Chào mừng trở lại, ${escapeHtml(existing.firstName || firstName)}!</b>\n\n` +
        `DailyFlow đang hoạt động bình thường.\n` +
        `Bạn có thể chọn nhanh các tính năng bên dưới:`,
      {
        parse_mode: "HTML",
        reply_markup: mainReplyKeyboard,
      }
    );
  }

  return ctx.reply(
    `👋 Chào bạn đến với <b>DailyFlow Bot</b>!\n\n` +
      `Để nhận thông báo nhắc việc và đồng bộ lịch trình cá nhân:\n` +
      `1. Đăng nhập vào website DailyFlow\n` +
      `2. Vào mục <b>Cài đặt</b> -> <b>Kết nối Telegram</b>\n` +
      `3. Bấm <b>"Lấy mã kết nối"</b> và gửi mã 6 số theo cú pháp:\n` +
      `   <code>/start &lt;mã_6_số&gt;</code>\n\n` +
      `Ví dụ: <code>/start 839201</code>`,
    { parse_mode: "HTML" }
  );
});

bot.command("help", handleHelpCommand);
bot.command("today", handleTodayCommand);
bot.command("water", handleWaterCommand);
bot.command("report", handleReportCommand);
bot.command("pending", handlePendingCommand);
bot.command("dashboard", handleDashboardCommand);

bot.command("pause", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.", { reply_markup: mainReplyKeyboard });

  await prisma.telegramConnection.update({
    where: { id: conn.id },
    data: { isPaused: true },
  });

  return ctx.reply("⏸ Đã tạm dừng nhận thông báo nhắc nhở. Gõ /resume khi bạn muốn bật lại.", {
    reply_markup: mainReplyKeyboard,
  });
});

bot.command("resume", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const conn = await getLinkedUser(chatId);
  if (!conn) return ctx.reply("⚠️ Bạn chưa liên kết tài khoản.", { reply_markup: mainReplyKeyboard });

  await prisma.telegramConnection.update({
    where: { id: conn.id },
    data: { isPaused: false },
  });

  return ctx.reply("▶️ Đã bật lại thông báo nhắc nhở từ DailyFlow!", {
    reply_markup: mainReplyKeyboard,
  });
});

// ---------------------------------------------------------
// Reply Keyboard Text Triggers (Bấm nút trên bàn phím menu Telegram)
// ---------------------------------------------------------

bot.hears([/📅\s*Lịch hôm nay/i, /^lịch$/i, /^hôm nay$/i, /^today$/i], handleTodayCommand);
bot.hears([/💧\s*Uống nước/i, /^uống nước$/i, /^nước$/i, /^water$/i], handleWaterCommand);
bot.hears([/📊\s*Báo cáo ngay/i, /^báo cáo$/i, /^report$/i], handleReportCommand);
bot.hears([/⏳\s*Việc chưa xong/i, /^chưa xong$/i, /^pending$/i], handlePendingCommand);
bot.hears([/🌐\s*Web Dashboard/i, /^dashboard$/i, /^web$/i], handleDashboardCommand);
bot.hears([/❓\s*Trợ giúp/i, /^trợ giúp$/i, /^help$/i, /^hướng dẫn$/i], handleHelpCommand);

// ---------------------------------------------------------
// Inline Keyboard Callback Handlers (Tức thì, chống treo 100%)
// ---------------------------------------------------------

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat?.id.toString();

  // 1. FAST ACKNOWLEDGEMENT: Trả lời callback ngay lập tức để gỡ biểu tượng quay loading trên điện thoại!
  try {
    if (data.startsWith("done:")) {
      await ctx.answerCallbackQuery({ text: "✅ Đang đánh dấu hoàn thành..." });
    } else if (data.startsWith("snooze:")) {
      await ctx.answerCallbackQuery({ text: "⏰ Đã hẹn nhắc lại sau 15 phút!" });
    } else if (data.startsWith("skip:")) {
      await ctx.answerCallbackQuery({ text: "⏭ Đã bỏ qua nhắc nhở lần này." });
    } else if (data.startsWith("water_add:")) {
      const ml = data.replace("water_add:", "");
      await ctx.answerCallbackQuery({ text: `💧 Đã thêm +${ml}ml nước!` });
    } else if (data === "refresh_today") {
      await ctx.answerCallbackQuery({ text: "🔄 Đang cập nhật lịch trình..." });
    } else {
      await ctx.answerCallbackQuery();
    }
  } catch (err) {
    console.error("Fast answerCallbackQuery caught error:", err);
  }

  if (!chatId) return;

  const conn = await getLinkedUser(chatId);
  if (!conn) {
    try {
      await ctx.reply("⚠️ Tài khoản chưa được liên kết. Vui lòng mở trang web để kết nối.");
    } catch {}
    return;
  }

  // Handle Refresh Today
  if (data === "refresh_today") {
    try {
      const todayStr = getVietnamDateString();
      const startOfDay = combineVietnamDateAndTime(todayStr, "00:00");
      const endOfDay = combineVietnamDateAndTime(todayStr, "23:59:59");

      const occurrences = await prisma.taskOccurrence.findMany({
        where: {
          task: { userId: conn.userId, deletedAt: null },
          scheduledAt: { gte: startOfDay, lte: endOfDay },
        },
        include: { task: true, schedule: true },
        orderBy: { scheduledAt: "asc" },
      });

      let text = `📅 <b>LỊCH TRÌNH HÔM NAY (${todayStr})</b> [Đã làm mới]\n\n`;
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
        text += `${idx + 1}. ${icon} <code>${time}</code> <b>${escapeHtml(occ.task.title)}</b>\n`;
      });

      const total = occurrences.length;
      const done = occurrences.filter((o) => o.status === "COMPLETED").length;
      text += `\n📊 Tiến độ: <b>${done}/${total}</b> (${total > 0 ? Math.round((done / total) * 100) : 0}%)`;

      const keyboard = new InlineKeyboard()
        .url("🌐 Mở Lịch 24 Giờ", `${process.env.APP_BASE_URL || "https://bot-notice.vercel.app"}/planner`)
        .text("🔄 Làm mới", "refresh_today");

      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      } catch {
        // Fallback without parse_mode if entities parsing failed
        await ctx.editMessageText(text.replace(/<[^>]*>/g, ""), {
          reply_markup: keyboard,
        });
      }
    } catch (err) {
      console.error("Refresh today error:", err);
    }
    return;
  }

  // Handle Done: `done:<occurrenceId>`
  if (data.startsWith("done:")) {
    const occId = data.replace("done:", "");
    try {
      await completeTaskOccurrence(conn.userId, occId, undefined, "TELEGRAM");

      const timeNow = new Date().toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
      });

      const originalText = ctx.callbackQuery.message?.text || "";
      const updatedText =
        escapeHtml(originalText) +
        `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>ĐÃ HOÀN THÀNH</b> lúc ${timeNow}`;

      const keyboard = new InlineKeyboard().url(
        "📊 Mở DailyFlow",
        process.env.APP_BASE_URL || "https://bot-notice.vercel.app"
      );

      try {
        await ctx.editMessageText(updatedText, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      } catch {
        try {
          await ctx.editMessageText(
            originalText + `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ ĐÃ HOÀN THÀNH lúc ${timeNow}`,
            { reply_markup: keyboard }
          );
        } catch {}
      }
    } catch (err) {
      console.error("Done action error:", err);
    }
    return;
  }

  // Handle Snooze: `snooze:<occurrenceId>`
  if (data.startsWith("snooze:")) {
    const occId = data.replace("snooze:", "");
    try {
      await snoozeOccurrence(conn.userId, occId, 15);

      const originalText = ctx.callbackQuery.message?.text || "";
      const updatedText =
        escapeHtml(originalText) +
        `\n\n━━━━━━━━━━━━━━━━━━━━\n⏰ <b>SẼ NHẮC LẠI SAU 15 PHÚT</b>`;

      try {
        await ctx.editMessageText(updatedText, { parse_mode: "HTML" });
      } catch {
        try {
          await ctx.editMessageText(
            originalText + `\n\n━━━━━━━━━━━━━━━━━━━━\n⏰ SẼ NHẮC LẠI SAU 15 PHÚT`
          );
        } catch {}
      }
    } catch (err) {
      console.error("Snooze action error:", err);
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

      const originalText = ctx.callbackQuery.message?.text || "";
      const updatedText =
        escapeHtml(originalText) +
        `\n\n━━━━━━━━━━━━━━━━━━━━\n⏭ <b>ĐÃ BỎ QUA LẦN NÀY</b>`;

      try {
        await ctx.editMessageText(updatedText, { parse_mode: "HTML" });
      } catch {
        try {
          await ctx.editMessageText(
            originalText + `\n\n━━━━━━━━━━━━━━━━━━━━\n⏭ ĐÃ BỎ QUA LẦN NÀY`
          );
        } catch {}
      }
    } catch (err) {
      console.error("Skip action error:", err);
    }
    return;
  }

  // Handle Quick Water Log: `water_add:<amount>`
  if (data.startsWith("water_add:")) {
    const amount = parseInt(data.replace("water_add:", ""), 10) || 250;
    try {
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

      await ctx.reply(
        `💧 Đã ghi nhận thêm <b>+${amount} ml</b>!\n📊 Hôm nay bạn đã uống: <b>${total}/${target} ml</b>`,
        {
          parse_mode: "HTML",
          reply_markup: mainReplyKeyboard,
        }
      );
    } catch (err) {
      console.error("Water add error:", err);
    }
    return;
  }
});
