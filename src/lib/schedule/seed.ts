import { prisma } from "../prisma";
import { combineVietnamDateAndTime, getVietnamDateString } from "./engine";

export const DEFAULT_SEED_ACTIVITIES = [
  {
    title: "Uống nước",
    description: "Bổ sung nước đầu ngày để cơ thể tỉnh táo",
    category: "WATER",
    priority: "MEDIUM",
    targetValue: 250,
    targetUnit: "ml",
    startTime: "09:30",
    durationMinutes: 5,
    recurrenceType: "DAILY",
  },
  {
    title: "Uống nước",
    description: "Bổ sung nước trước giờ ăn trưa",
    category: "WATER",
    priority: "MEDIUM",
    targetValue: 250,
    targetUnit: "ml",
    startTime: "11:30",
    durationMinutes: 5,
    recurrenceType: "DAILY",
  },
  {
    title: "Uống nước",
    description: "Cấp nước cho cơ thể vào đầu giờ chiều",
    category: "WATER",
    priority: "MEDIUM",
    targetValue: 250,
    targetUnit: "ml",
    startTime: "14:30",
    durationMinutes: 5,
    recurrenceType: "DAILY",
  },
  {
    title: "Uống nước",
    description: "Giữ tinh thần sảng khoái và tập trung",
    category: "WATER",
    priority: "MEDIUM",
    targetValue: 250,
    targetUnit: "ml",
    startTime: "16:30",
    durationMinutes: 5,
    recurrenceType: "DAILY",
  },
  {
    title: "Tập thể dục",
    description: "Chạy bộ hoặc rèn luyện thể lực cuối ngày",
    category: "EXERCISE",
    priority: "HIGH",
    targetValue: 30,
    targetUnit: "phút",
    startTime: "17:30",
    durationMinutes: 30,
    recurrenceType: "DAILY",
  },
  {
    title: "Uống nước",
    description: "Bổ sung nước sau buổi tập luyện",
    category: "WATER",
    priority: "MEDIUM",
    targetValue: 250,
    targetUnit: "ml",
    startTime: "19:00",
    durationMinutes: 5,
    recurrenceType: "DAILY",
  },
  {
    title: "Làm bài tập",
    description: "Tập trung học tập hoặc hoàn thành bài vở nghiên cứu",
    category: "STUDY",
    priority: "HIGH",
    targetValue: 60,
    targetUnit: "phút",
    startTime: "19:30",
    durationMinutes: 60,
    recurrenceType: "DAILY",
  },
  {
    title: "Vận động nhẹ",
    description: "Giãn cơ, vươn vai thư giãn mắt và cột sống",
    category: "EXERCISE",
    priority: "LOW",
    targetValue: 10,
    targetUnit: "phút",
    startTime: "20:00",
    durationMinutes: 10,
    recurrenceType: "DAILY",
  },
  {
    title: "Uống nước",
    description: "Bổ sung nước buổi tối",
    category: "WATER",
    priority: "MEDIUM",
    targetValue: 250,
    targetUnit: "ml",
    startTime: "20:30",
    durationMinutes: 5,
    recurrenceType: "DAILY",
  },
  {
    title: "Kiểm tra công việc chưa hoàn thành",
    description: "Rà soát checklist công việc trong ngày và lên kế hoạch",
    category: "WORK",
    priority: "MEDIUM",
    targetValue: 1,
    targetUnit: "lần",
    startTime: "21:00",
    durationMinutes: 15,
    recurrenceType: "DAILY",
  },
  {
    title: "Chuẩn bị đi ngủ",
    description: "Tắt thiết bị điện tử, thư giãn và ngủ đúng giờ",
    category: "HEALTH",
    priority: "HIGH",
    targetValue: 1,
    targetUnit: "lần",
    startTime: "22:30",
    durationMinutes: 15,
    recurrenceType: "DAILY",
  },
];

export async function seedInitialScheduleForUser(userId: string, force = false): Promise<boolean> {
  // Check settings
  const settings = await prisma.applicationSettings.findUnique({
    where: { userId },
  });

  if (settings?.isInitialized && !force) {
    return false;
  }

  const todayStr = getVietnamDateString();
  const effectiveFrom = combineVietnamDateAndTime(todayStr, "00:00");

  for (const item of DEFAULT_SEED_ACTIVITIES) {
    const task = await prisma.task.create({
      data: {
        userId,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        targetValue: item.targetValue,
        targetUnit: item.targetUnit,
        isActive: true,
        telegramEnabled: true,
        schedules: {
          create: {
            startTime: item.startTime,
            durationMinutes: item.durationMinutes,
            recurrenceType: item.recurrenceType,
            effectiveFrom,
            allowSnooze: true,
            snoozeMinutes: 15,
          },
        },
      },
    });

    // Create occurrence for today
    const schedule = await prisma.taskSchedule.findFirst({
      where: { taskId: task.id },
    });

    if (schedule) {
      const scheduledAt = combineVietnamDateAndTime(todayStr, item.startTime);
      const occurrence = await prisma.taskOccurrence.create({
        data: {
          taskId: task.id,
          scheduleId: schedule.id,
          scheduledAt,
          status: "PENDING",
        },
      });

      // Create notification job
      await prisma.notificationJob.create({
        data: {
          occurrenceId: occurrence.id,
          scheduledFor: scheduledAt,
          status: "PENDING",
        },
      });
    }
  }

  // Update or create settings
  await prisma.applicationSettings.upsert({
    where: { userId },
    update: { isInitialized: true, waterTargetMl: 1500 },
    create: { userId, isInitialized: true, waterTargetMl: 1500 },
  });

  // Ensure report configuration exists
  await prisma.reportConfiguration.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      dailyEnabled: true,
      dailyTime: "22:00",
      dailyWithImage: true,
      dailyUnfinished: true,
      weeklyEnabled: true,
      weeklyDay: 0,
      weeklyTime: "21:45",
      weeklyWithImage: true,
      monthlyEnabled: true,
      monthlyTime: "22:15",
      monthlyWithImage: true,
    },
  });

  return true;
}
