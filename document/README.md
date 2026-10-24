# 📚 TÀI LIỆU TOÀN TẬP DỰ ÁN DAILYFLOW

> **DailyFlow** là nền tảng quản trị năng suất cá nhân và lập kế hoạch 24 giờ thông minh, kết nối đồng bộ hai chiều với Telegram Bot, cơ sở dữ liệu PostgreSQL (Neon) và triển khai tối ưu trên Vercel kết hợp cron-job.org.

---

## 📌 MỤC ĐÍCH TÀI LIỆU

Bộ tài liệu này được biên soạn nhằm cung cấp cái nhìn **tường tận, chuyên sâu từ kiến trúc hệ thống, cấu trúc cơ sở dữ liệu, thuật toán lõi đến từng luồng nghiệp vụ**, giúp lập trình viên và chủ sở hữu dự án:
1. Hiểu rõ nguyên lý hoạt động của từng mô-đun mà không cần đọc lại toàn bộ mã nguồn.
2. Dễ dàng bảo trì, nâng cấp, mở rộng tính năng mới trong tương lai.
3. Nhanh chóng khắc phục sự cố (troubleshooting) khi vận hành thực tế.

---

## 🗺️ MỤC LỤC BỘ TÀI LIỆU (DOCUMENTATION SITEMAP)

| Tài liệu | Nội dung chính |
| :--- | :--- |
| **[01. Tổng quan Kiến trúc Hệ thống](file:///home/zinex/code/Bot-notice/document/01_ARCHITECTURE.md)** | Sơ đồ hệ thống tổng thể, Tech Stack, Thiết kế Database, Cơ chế Múi giờ UTC+7 và Bảo mật. |
| **[02. Bộ máy Lập lịch 24 Giờ](file:///home/zinex/code/Bot-notice/document/02_SCHEDULE_ENGINE.md)** | Vòng đời hoạt động (`Task` ➔ `Schedule` ➔ `Occurrence` ➔ `Job`), Thuật toán phát hiện xung đột và Kéo-thả. |
| **[03. Telegram Bot & Cơ chế Tương tác Hai Chiều](file:///home/zinex/code/Bot-notice/document/03_TELEGRAM_BOT.md)** | Tích hợp grammY, Mã OTP liên kết, Bàn phím Reply Menu, Inline Buttons và kỹ thuật chống treo 0ms. |
| **[04. Hệ thống Cron & Điều phối Nhắc việc](file:///home/zinex/code/Bot-notice/document/04_CRON_DISPATCHER.md)** | Vòng lặp Dispatch 24/7 qua cron-job.org, Xử lý Idempotent, Báo cáo tự động và Nút gửi tức thì. |
| **[05. Danh mục Chi tiết Toàn bộ API Endpoints](file:///home/zinex/code/Bot-notice/document/05_API_REFERENCE.md)** | Bảng tra cứu 25+ API Route Handlers (Auth, Planner, Tasks, Water, Telegram, Reports, Cron). |
| **[06. Hướng dẫn Triển khai & Cẩm nang Sự cố](file:///home/zinex/code/Bot-notice/document/06_DEPLOYMENT_MAINTENANCE.md)** | Thiết lập Neon PostgreSQL, Vercel Env, Quy trình Git Push và Cách xử lý lỗi thường gặp. |

---

## 🏗️ CẤU TRÚC THƯ MỤC NGUỒN (PROJECT DIRECTORY TREE)

```text
Bot-notice/
├── .env                          # Biến môi trường local
├── .env.example                  # Mẫu cấu hình biến môi trường
├── package.json                  # Dependencies & scripts
├── push.sh                       # Script bash 1 chạm: build kiểm tra, commit và push Vercel
├── prisma/
│   ├── schema.prisma             # Định nghĩa 12 Database Models (PostgreSQL)
│   └── seed.ts                   # Dữ liệu khởi tạo (11 hoạt động mẫu & cài đặt)
├── document/                     # 📂 Thư mục toàn bộ tài liệu dự án
│   ├── README.md                 # Chỉ mục tài liệu (file này)
│   ├── 01_ARCHITECTURE.md        # Kiến trúc tổng thể & Database
│   ├── 02_SCHEDULE_ENGINE.md     # Cơ chế lập lịch & thuật toán
│   ├── 03_TELEGRAM_BOT.md        # Tương tác Telegram Bot
│   ├── 04_CRON_DISPATCHER.md     # Cron & điều phối báo cáo
│   ├── 05_API_REFERENCE.md       # Tài liệu API endpoints
│   └── 06_DEPLOYMENT_MAINTENANCE.md # Triển khai & xử lý sự cố
├── src/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── layout.tsx            # Root Layout (Fonts, Theme Provider)
│   │   ├── page.tsx              # Trang chủ chuyển hướng
│   │   ├── login/                # Đăng nhập bằng mã PIN
│   │   ├── overview/             # Dashboard tổng quan chỉ số
│   │   ├── planner/              # Lịch 24 giờ (Timeline, List, Week)
│   │   ├── tasks/                # Quản lý danh sách hoạt động
│   │   ├── habits/               # Theo dõi thói quen & chuỗi streak
│   │   ├── water/                # Trạm theo dõi lượng nước
│   │   ├── analytics/            # Biểu đồ năng suất đa chiều
│   │   ├── history/              # Lịch sử hoàn thành & nhật ký thông báo
│   │   ├── settings/             # Cài đặt kết nối Bot, Reports, Seed
│   │   └── api/                  # 25+ Route Handlers (RESTful API)
│   │       ├── auth/             # Xác thực session JWT
│   │       ├── cron/             # Dispatcher & chuẩn bị ngày mới
│   │       ├── dashboard/        # Dữ liệu tổng hợp biểu đồ
│   │       ├── planner/          # CRUD lịch trình & kéo-thả
│   │       ├── reports/          # Cấu hình & gửi báo cáo tức thì
│   │       ├── settings/         # Cài đặt người dùng & nạp seed
│   │       ├── tasks/            # Quản lý công việc
│   │       ├── telegram/         # Webhook, pairing code, unpair
│   │       └── water/            # Ghi nhận nước
│   ├── components/               # Giao diện người dùng tái sử dụng
│   │   ├── AppShell.tsx          # Khung ứng dụng responsive (Desktop + Mobile)
│   │   ├── Sidebar.tsx           # Sidebar desktop, Mobile Drawer & Mobile Bottom Nav
│   │   ├── Topbar.tsx            # Thanh tiêu đề, đồng hồ VN, nút Gửi báo cáo
│   │   ├── InstantReportButton.tsx # Nút gửi báo cáo ngay lập tức
│   │   ├── ThemeToggle.tsx       # Chuyển đổi Dark/Light mode
│   │   └── planner/              # Component lịch 24 giờ (@dnd-kit)
│   │       ├── Timeline24Hour.tsx# Trục thời gian 24h & vạch giờ hiện tại
│   │       ├── ListView.tsx      # Chế độ xem danh sách
│   │       ├── WeeklyView.tsx    # Chế độ xem theo tuần
│   │       ├── AddReminderModal.tsx # Modal tạo lịch nhắc mới
│   │       └── EditReminderModal.tsx# Modal chỉnh sửa lịch nhắc
│   └── lib/                      # Các module logic nghiệp vụ lõi
│       ├── prisma.ts             # Prisma Client singleton
│       ├── auth/session.ts       # Quản lý session JWT & người dùng chính
│       ├── schedule/             # Động cơ lập lịch
│       │   ├── types.ts          # Định nghĩa kiểu dữ liệu TS
│       │   ├── engine.ts         # Tính toán giờ VN, phát hiện xung đột
│       │   └── service.ts        # Nghiệp vụ DB (tạo, cập nhật, hoàn thành)
│       ├── telegram/             # Tương tác Bot Telegram
│       │   └── bot.ts            # Khởi tạo grammY bot, lệnh & bàn phím
│       ├── cron/                 # Điều phối Cron
│       │   └── dispatcher.ts     # Gửi tin nhắn đến hạn & báo cáo
│       └── reports/              # Tạo báo cáo tổng kết
│           └── generator.ts      # Tính toán tỷ lệ, chuỗi thói quen
└── tests/                        # Kiểm thử tự động (Vitest)
    ├── schedule-engine.test.ts   # Test tính toán giờ, phút, phát hiện trùng
    └── cron-dispatch.test.ts     # Test logic lọc thông báo đến hạn
```

---

## 💡 NGUYÊN TẮC THIẾT KẾ BẤT BIẾN CỦA DỰ ÁN

> [!IMPORTANT]
> **Toàn bộ lịch trình và cấu hình là ĐỘNG (Dynamic)**:
> Người dùng tuyệt đối không bao giờ phải sửa mã nguồn, không chỉnh sửa file JSON, không cấu hình lại cron-job.org và không cần redeploy khi muốn thay đổi giờ giấc hay thêm bớt công việc. Cơ sở dữ liệu PostgreSQL là nguồn chân lý duy nhất (Single Source of Truth), toàn bộ thao tác được thực hiện trực quan trên giao diện Web.
