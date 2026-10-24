# DailyFlow - Trợ Lý Cuộc Sống & Lập Kế Hoạch 24 Giờ Cá Nhân

> **DailyFlow** là trung tâm điều hành năng suất cá nhân toàn diện, kết hợp Lịch 24 giờ động, Telegram Bot tương tác hai chiều, hệ thống lên lịch thông minh và báo cáo thống kê đa chiều triển khai trên Vercel & Neon PostgreSQL.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Lập Kế Hoạch 24 Giờ Động (00:00 - 23:59)**:
   - Toàn bộ lịch nhắc được quản lý trực quan trên giao diện web.
   - **Tuyệt đối không cần sửa mã nguồn, không chỉnh sửa file JSON, không cần cấu hình lại cron-job.org hay redeploy ứng dụng** khi thay đổi giờ hoặc thêm bớt hoạt động.
   - Trục thời gian 24 giờ trực quan với vạch báo thời gian thực (`Asia/Ho_Chi_Minh` UTC+7).
   - Kéo-thả (Drag & Drop) dời lịch sang khung giờ mới mượt mà với `@dnd-kit`.
   - Cảnh báo trùng lặp thời gian thông minh (Conflict Detection).
   - 3 chế độ xem: **Trục 24 giờ (Timeline)**, **Danh sách (List View)**, **Lịch tuần (Weekly View)**.

2. **Telegram Bot Tương Tác Hai Chiều (`grammY`)**:
   - Nhận tin nhắn nhắc nhở kèm nút bấm tương tác: `[✅ Hoàn thành]`, `[⏰ Nhắc sau 15 phút]`, `[⏭ Bỏ qua]`.
   - Kết nối an toàn qua mã OTP một lần 6 số (Pairing Code) 15 phút.
   - Hỗ trợ đầy đủ các lệnh tiếng Việt: `/today`, `/done`, `/pending`, `/water`, `/report`, `/week`, `/month`, `/dashboard`, `/pause`, `/resume`, `/help`.

3. **Theo Dõi Uống Nước Độc Lập**:
   - Bình nước trực quan theo dõi lượng nước nạp vào cơ thể.
   - Mục tiêu mặc định 1.500 ml/ngày (có thể tùy chỉnh tự do trong Cài đặt).
   - Đồng bộ hai chiều với Telegram Bot qua nút bấm `+250 ml`, `+500 ml`.

4. **Báo Cáo & Phân Tích Đa Chiều**:
   - Thống kê Ngày, Tuần (7 ngày) và Tháng (bản đồ nhiệt Heatmap thói quen).
   - Tự động gửi báo cáo Ngày (22:00), Tuần (Chủ Nhật 21:45), Tháng (ngày cuối tháng 22:15) qua Telegram.
   - Nút "Gửi báo cáo thử" trong Cài đặt giúp kiểm tra kết nối ngay lập tức.

5. **Kiến Trúc cron-job.org Tối Ưu**:
   - `POST /api/cron/dispatch`: Chạy mỗi phút (24/7) để kiểm tra các thông báo đến hạn và gửi Telegram.
   - `POST /api/cron/prepare-day`: Chạy lúc 00:05 để chuẩn bị dữ liệu cho ngày mới.
   - Bảo vệ an toàn bằng `CRON_SECRET`.
   - Idempotent: Tuyệt đối không gửi lặp thông báo nếu cron gọi lại.

---

## 🛠 TECH STACK

- **Frontend**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS, Lucide React, Recharts, @dnd-kit
- **Backend**: Next.js Route Handlers, Prisma ORM, Neon PostgreSQL
- **Bot Engine**: Telegram Bot API với `grammY`
- **Xác thực**: JWT Cookie bảo mật (`jose`) & Mã PIN quản trị (`ADMIN_PIN`)
- **Triển khai**: Vercel & cron-job.org
- **Kiểm thử**: Vitest

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI

### 1. Chuẩn bị môi trường & Biến môi trường

Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Cấu hình các biến trong file `.env`:
```env
# PostgreSQL Connection (Neon.tech hoặc Vercel Postgres)
DATABASE_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/dailyflow?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/dailyflow?sslmode=require"

# Domain triển khai (Vercel hoặc localhost)
APP_BASE_URL="https://your-dailyflow.vercel.app"

# Telegram Bot Token (Lấy từ @BotFather trên Telegram)
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
TELEGRAM_WEBHOOK_SECRET="random_webhook_secret_string"

# Khóa bí mật cho Cron
CRON_SECRET="your_secure_cron_secret_here"

# Khóa bí mật Auth & Mã PIN
AUTH_SECRET="your_32_chars_random_auth_secret_key"
ADMIN_PIN="123456"

# Múi giờ
NEXT_PUBLIC_TIMEZONE="Asia/Ho_Chi_Minh"
```

### 2. Cài đặt thư viện & Tạo Database

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### 3. Chạy môi trường Development

```bash
npm run dev
```
Truy cập: `http://localhost:3000` (Mã PIN mặc định: `123456`).

### 4. Chạy kiểm thử tự động

```bash
npm test
```

---

## 🤖 HƯỚNG DẪN KẾT NỐI TELEGRAM BOT

1. Mở Telegram, nhắn tin cho `@BotFather` để tạo bot mới: `/newbot`.
2. Đặt tên và username cho bot, sao chép API Token vào biến `TELEGRAM_BOT_TOKEN`.
3. Sau khi triển khai lên Vercel:
   - Gọi API cài đặt webhook:
     ```bash
     curl -X POST https://your-dailyflow.vercel.app/api/telegram/setup-webhook
     ```
4. Đăng nhập vào Website DailyFlow -> vào **Cài đặt** -> nhấn **"Tạo mã kết nối Telegram"** (nhận mã 6 số, ví dụ `849201`).
5. Mở bot trên Telegram và gửi:
   ```
   /start 849201
   ```
6. Bot sẽ phản hồi xác nhận liên kết thành công!

---

## ⏰ CẤU HÌNH CRON-JOB.ORG

Tạo 2 lịch tự động trên [cron-job.org](https://cron-job.org):

1. **Job Dispatch Thông Báo (Chạy mỗi 1 phút, 24/7)**:
   - **URL**: `https://your-dailyflow.vercel.app/api/cron/dispatch`
   - **Method**: `POST`
   - **Schedule**: Every 1 minute (`* * * * *`)
   - **Headers**:
     - `x-cron-secret`: `<CRON_SECRET_CỦA_BẠN>`
     - `Content-Type`: `application/json`

2. **Job Chuẩn Bị Lịch Ngày Mới (Chạy lúc 00:05 mỗi ngày)**:
   - **URL**: `https://your-dailyflow.vercel.app/api/cron/prepare-day`
   - **Method**: `POST`
   - **Schedule**: Daily at 00:05 (`5 0 * * *`)
   - **Timezone**: `Asia/Ho_Chi_Minh`
   - **Headers**:
     - `x-cron-secret`: `<CRON_SECRET_CỦA_BẠN>`

---

## 📦 TRIỂN KHAI LÊN VERCEL

1. Đẩy mã nguồn lên GitHub repository.
2. Truy cập [Vercel](https://vercel.com) -> **Add New Project** -> Chọn repository này.
3. Trong phần **Environment Variables**, điền đầy đủ các biến từ `.env.example`.
4. Nhấn **Deploy**.
5. Sau khi deploy hoàn tất, thiết lập webhook Telegram và tạo cron-job theo hướng dẫn ở trên.

---

## 📄 BẢN QUYỀN

Phát triển bởi đội ngũ Kỹ sư Cao cấp cho nền tảng **DailyFlow** - 2026.
