import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SEED_ACTIVITIES = [
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

async function main() {
  console.log("🌱 Khởi tạo dữ liệu mẫu cho DailyFlow...");

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Chủ nhân DailyFlow",
        email: "admin@dailyflow.local",
        timezone: "Asia/Ho_Chi_Minh",
        settings: {
          create: {
            waterTargetMl: 1500,
            timezone: "Asia/Ho_Chi_Minh",
            theme: "system",
            isInitialized: true,
          },
        },
        telegramConnection: {
          create: {
            isActive: true,
            isPaused: false,
          },
        },
        reportConfiguration: {
          create: {
            dailyEnabled: true,
            dailyTime: "22:00",
            dailyWithImage: true,
            dailyUnfinished: true,
            weeklyEnabled: true,
            weeklyDay: 0,
            weeklyTime: "21:45",
            monthlyEnabled: true,
            monthlyTime: "22:15",
          },
        },
      },
    });
    console.log("✓ Đã tạo người dùng mặc định:", user.id);
  }

  for (const item of DEFAULT_SEED_ACTIVITIES) {
    await prisma.task.create({
      data: {
        userId: user.id,
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
            allowSnooze: true,
            snoozeMinutes: 15,
          },
        },
      },
    });
  }

  console.log(`✓ Đã nạp thành công ${DEFAULT_SEED_ACTIVITIES.length} hoạt động mẫu vào cơ sở dữ liệu!`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi chạy seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
