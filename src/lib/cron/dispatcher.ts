import { InlineKeyboard } from "grammy";
import { prisma } from "../prisma";
import { bot } from "../telegram/bot";
import {
  combineVietnamDateAndTime,
  getVietnamDateString,
  getVietnamTimeComponents,
  timeStringToMinutes,
} from "../schedule/engine";
import { syncDailyOccurrences } from "../schedule/service";

const CATEGORY_EMOJIS: Record<string, string> = {
  WATER: "💧",
  EXERCISE: "🏋️",
  STUDY: "📚",
  WORK: "💼",
  HEALTH: "🧘",
  OTHER: "🎯",
};

/**
 * Dispatch due notification jobs to Telegram
 */
export async function dispatchDueNotifications() {
  const now = new Date();

  // Atomically select and mark pending jobs due for delivery
  const dueJobs = await prisma.notificationJob.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
    },
    include: {
      occurrence: {
        include: {
          task: {
            include: {
              user: {
                include: {
                  telegramConnection: true,
                  settings: true,
                },
              },
            },
          },
          schedule: true,
        },
      },
    },
    take: 50, // Process in batches
  });

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const job of dueJobs) {
    results.processed++;

    const occurrence = job.occurrence;
    const task = occurrence.task;
    const user = task.user;
    const telegram = user.telegramConnection;

    // Check if task is still active and occurrence still pending/snoozed
    if (
      !task.isActive ||
      task.deletedAt !== null ||
      (occurrence.status !== "PENDING" && occurrence.status !== "SNOOZED")
    ) {
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: "CANCELLED" },
      });
      results.skipped++;
      continue;
    }

    // Check if Telegram connection is valid
    if (!telegram?.chatId || !telegram.isActive || telegram.isPaused) {
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorLog: "Telegram chưa được liên kết hoặc đang tạm dừng.",
        },
      });
      results.failed++;
      continue;
    }

    // Format message
    const emoji = CATEGORY_EMOJIS[task.category] || "⏰";
    const startTime = occurrence.schedule?.startTime || "Bây giờ";
    const target = task.targetValue
      ? `${task.targetValue} ${task.targetUnit || ""}`
      : undefined;

    let messageText = "";
    const keyboard = new InlineKeyboard();

    if (task.category === "WATER") {
      const todayStr = getVietnamDateString();
      const intakes = await prisma.waterIntake.findMany({
        where: { userId: user.id, date: todayStr },
      });
      const currentWater = intakes.reduce((sum, item) => sum + item.amountMl, 0);
      const targetWater = user.settings?.waterTargetMl || 1500;

      messageText =
        `💧 <b>NHẮC UỐNG NƯỚC</b>\n\n` +
        `Đến giờ uống nước rồi!\n\n` +
        `🥛 <b>Mục tiêu:</b> ${target || "250 ml"}\n` +
        `📊 <b>Đã uống hôm nay:</b> ${currentWater.toLocaleString()} / ${targetWater.toLocaleString()} ml\n\n` +
        `<i>Hãy uống một cốc nước để giữ năng lượng sảng khoái nhé!</i>`;

      keyboard
        .text("✅ Đã uống", `done:${occurrence.id}`)
        .text("⏰ Nhắc sau 15p", `snooze:${occurrence.id}`)
        .row()
        .text("⏭ Bỏ qua", `skip:${occurrence.id}`);
    } else {
      messageText =
        `${emoji} <b>NHẮC LỊCH: ${task.title.toUpperCase()}</b>\n\n` +
        `⏰ <b>Thời gian:</b> <code>${startTime}</code>`;

      if (occurrence.schedule?.durationMinutes) {
        messageText += ` (${occurrence.schedule.durationMinutes} phút)`;
      }

      if (target) {
        messageText += `\n🎯 <b>Mục tiêu:</b> ${target}`;
      }

      if (task.description) {
        messageText += `\n📝 <b>Ghi chú:</b> ${task.description}`;
      }

      keyboard
        .text("✅ Hoàn thành", `done:${occurrence.id}`)
        .text("⏰ Nhắc sau 15p", `snooze:${occurrence.id}`)
        .row()
        .text("⏭ Bỏ qua", `skip:${occurrence.id}`);
    }

    try {
      const sentMsg = await bot.api.sendMessage(telegram.chatId, messageText, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      // Update job to SENT and record delivery
      await prisma.$transaction([
        prisma.notificationJob.update({
          where: { id: job.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        }),
        prisma.notificationDelivery.create({
          data: {
            jobId: job.id,
            telegramMessageId: sentMsg.message_id.toString(),
            chatId: telegram.chatId,
            status: "DELIVERED",
          },
        }),
      ]);

      results.sent++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gửi thất bại";
      results.failed++;
      results.errors.push(errorMsg);

      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          retryCount: { increment: 1 },
          errorLog: errorMsg,
          status: job.retryCount >= 2 ? "FAILED" : "PENDING",
        },
      });
    }
  }

  // Also check and send due automated reports
  await checkAndSendAutomatedReports();

  return results;
}

/**
 * Checks and triggers due Daily, Weekly, and Monthly reports
 */
export async function checkAndSendAutomatedReports() {
  const configs = await prisma.reportConfiguration.findMany({
    include: {
      user: {
        include: {
          telegramConnection: true,
          settings: true,
        },
      },
    },
  });

  const now = new Date();
  const todayStr = getVietnamDateString(now);
  const { hour, minute } = getVietnamTimeComponents(now);
  const currentMinutes = hour * 60 + minute;

  for (const config of configs) {
    const telegram = config.user.telegramConnection;
    if (!telegram?.chatId || !telegram.isActive || telegram.isPaused) {
      continue;
    }

    // 1. Daily Report Check
    if (config.dailyEnabled) {
      const reportMinutes = timeStringToMinutes(config.dailyTime || "22:00");
      const lastSentStr = config.lastDailySentAt
        ? getVietnamDateString(config.lastDailySentAt)
        : null;

      if (currentMinutes >= reportMinutes && lastSentStr !== todayStr) {
        await sendDailyReport(config.userId, telegram.chatId);
        await prisma.reportConfiguration.update({
          where: { id: config.id },
          data: { lastDailySentAt: now },
        });
      }
    }
  }
}

/**
 * Compiles and dispatches daily summary report
 */
export async function sendDailyReport(userId: string, chatId: string) {
  const todayStr = getVietnamDateString();
  const startOfDay = combineVietnamDateAndTime(todayStr, "00:00");
  const endOfDay = combineVietnamDateAndTime(todayStr, "23:59:59");

  const occurrences = await prisma.taskOccurrence.findMany({
    where: {
      task: { userId, deletedAt: null },
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { task: true, schedule: true },
  });

  const total = occurrences.length;
  const completed = occurrences.filter((o) => o.status === "COMPLETED").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const waterIntakes = await prisma.waterIntake.findMany({
    where: { userId, date: todayStr },
  });
  const waterTotal = waterIntakes.reduce((sum, item) => sum + item.amountMl, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });
  const waterTarget = user?.settings?.waterTargetMl || 1500;

  const exerciseOccs = occurrences.filter(
    (o) => o.task.category === "EXERCISE" && o.status === "COMPLETED"
  );
  const exerciseMin = exerciseOccs.reduce((sum, o) => sum + (o.schedule?.durationMinutes || 0), 0);

  const studyOccs = occurrences.filter(
    (o) => o.task.category === "STUDY" && o.status === "COMPLETED"
  );
  const studyMin = studyOccs.reduce((sum, o) => sum + (o.schedule?.durationMinutes || 0), 0);

  const text =
    `📊 <b>TỔNG KẾT HÔM NAY (${todayStr})</b>\n\n` +
    `✅ Hoàn thành: <b>${completed}/${total}</b> (${pct}%)\n` +
    `💧 Uống nước: <b>${waterTotal.toLocaleString()} / ${waterTarget.toLocaleString()} ml</b>\n` +
    `🏋️ Tập thể dục: <b>${exerciseMin} phút</b>\n` +
    `📚 Học tập: <b>${studyMin} phút</b>\n` +
    `🔥 Tiếp tục giữ vững phong độ nhé!\n\n` +
    `👉 Bấm bên dưới để xem biểu đồ chi tiết:`;

  const keyboard = new InlineKeyboard().url(
    "📊 Mở Dashboard",
    `${process.env.APP_BASE_URL || "https://bot-notice.vercel.app"}/overview`
  );

  try {
    await bot.api.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Failed to send daily report:", err);
    throw err;
  }
}

