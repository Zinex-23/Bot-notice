# 🛠️ 06. HƯỚNG DẪN TRIỂN KHAI & CẨM NANG SỰ CỐ

Tài liệu này cung cấp hướng dẫn từng bước để thiết lập mới toàn bộ hệ thống từ đầu (Neon PostgreSQL + Vercel + Telegram + cron-job.org) và cẩm nang xử lý dứt điểm các sự cố vận hành thường gặp.

---

## 1. HƯỚNG DẪN THIẾT LẬP TỪ ĐẦU (STEP-BY-STEP SETUP)

### Bước 1: Khởi tạo Cơ sở dữ liệu Neon PostgreSQL
1. Truy cập [neon.tech](https://neon.tech) và đăng ký tài khoản miễn phí.
2. Tạo một Project mới (Chọn vùng AWS gần nhất, ví dụ `us-east-1` hoặc `ap-southeast-1`).
3. Trong bảng điều khiển Neon, sao chép 2 chuỗi kết nối:
   - **Pooled Connection String** (Dùng cho `DATABASE_URL`): Chứa từ khóa `-pooler` (cổng 5432, có pgbouncer).
   - **Direct Connection String** (Dùng cho `DIRECT_URL`): Kết nối trực tiếp không qua pgbouncer để chạy migration.

### Bước 2: Tạo Bot Telegram với @BotFather
1. Mở ứng dụng Telegram, tìm bot chính thức `@BotFather`.
2. Gửi lệnh `/newbot`, nhập tên hiển thị và username (kết thúc bằng chữ `bot`, ví dụ: `my_dailyflow_bot`).
3. Sao chép chuỗi mã thông báo bảo mật **API Token** (dạng `123456789:ABCdefGhIJKlmNoPQRstuVWXyz`).

### Bước 3: Cấu hình biến môi trường trên Vercel
Truy cập [Vercel Project Settings](https://vercel.com) ➔ mục **Environment Variables** và cấu hình đầy đủ:

```ini
# Database
DATABASE_URL="postgresql://neondb_owner:password@ep-sample-pooler.c-14.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
DIRECT_URL="postgresql://neondb_owner:password@ep-sample.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Tên miền chính thức của ứng dụng
APP_BASE_URL="https://your-project.vercel.app"

# Telegram Bot
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
TELEGRAM_WEBHOOK_SECRET="tao_mot_chuoi_ngau_nhien_dai_o_day"

# Cron & Auth
CRON_SECRET="chuoi_bi_mat_cho_cron_job_org"
AUTH_SECRET="chuoi_bi_mat_jwt_toi_thieu_32_ky_tu_ngau_nhien"
ADMIN_PIN="123456"

# Múi giờ
NEXT_PUBLIC_TIMEZONE="Asia/Ho_Chi_Minh"
```

### Bước 4: Đẩy dữ liệu & Triển khai
Tại máy tính cá nhân, chạy lệnh:
```bash
# Đẩy schema lên database
npx prisma db push

# Nạp 11 hoạt động mẫu ban đầu
npm run db:seed

# Đẩy code lên GitHub để Vercel tự động deploy
./push.sh "feat: initial deployment"
```

### Bước 5: Kích hoạt Webhook Telegram
Sau khi Vercel deploy thành công, truy cập trang Cài đặt trên Web (`https://your-project.vercel.app/settings`) và bấm nút **"⚡ Kích hoạt Webhook Bot"**, hoặc chạy lệnh curl:
```bash
curl -X POST https://your-project.vercel.app/api/telegram/setup-webhook
```

### Bước 6: Cấu hình cron-job.org
Đăng nhập vào [cron-job.org](https://cron-job.org) ➔ Tạo 2 lịch Cron:
1. **Lịch Dispatch Thông Báo (Chạy mỗi 1 phút 24/7)**:
   - **URL**: `https://your-project.vercel.app/api/cron/dispatch`
   - **Method**: `POST`
   - **Schedule**: `* * * * *` (Every 1 minute)
   - **Request Headers**:
     - `x-cron-secret`: `<CRON_SECRET_CỦA_BẠN>`
     - `Content-Type`: `application/json`
2. **Lịch Chuẩn Bị Ngày Mới (Chạy lúc 00:05 sáng mỗi ngày)**:
   - **URL**: `https://your-project.vercel.app/api/cron/prepare-day`
   - **Method**: `POST`
   - **Schedule**: `5 0 * * *` (Lúc 00:05)
   - **Timezone**: `Asia/Ho_Chi_Minh`
   - **Request Headers**:
     - `x-cron-secret`: `<CRON_SECRET_CỦA_BẠN>`

---

## 2. QUY TRÌNH ĐẨY CODE AN TOÀN VỚI `push.sh`

Trong thư mục gốc có sẵn script [[push.sh](file:///home/zinex/code/Bot-notice/push.sh)]. Mỗi khi bạn sửa mã nguồn, chỉ cần chạy một lệnh duy nhất:

```bash
./push.sh "nội dung mô tả thay đổi của bạn"
```

Script này tự động:
1. Chạy `git status` kiểm tra các file đã thay đổi.
2. Chạy `git add .` gom toàn bộ thay đổi.
3. Chạy `git commit -m "..."`.
4. Chạy `git push origin main` đẩy mã nguồn lên GitHub.
5. GitHub tự động kích hoạt Vercel Build và cập nhật bản mới nhất trong vòng 30-45 giây.

---

## 3. CẨM NANG XỬ LÝ SỰ CỐ (TROUBLESHOOTING RUNBOOK)

### 🔴 Sự cố 1: Gõ lệnh bot (`/today`, `/help`) nhưng bot im lặng không trả lời
* **Nguyên nhân 1**: Webhook chưa được kích hoạt hoặc URL Webhook bị sai.
  * **Cách xử lý**: Vào trang Web Dashboard ➔ Cài đặt ➔ bấm **"⚡ Kích hoạt Webhook Bot"**. Hoặc kiểm tra:
    ```bash
    curl -X POST https://your-project.vercel.app/api/telegram/setup-webhook
    ```
    Đảm bảo trường `info.url` trùng khớp với URL trang web của bạn.
* **Nguyên nhân 2**: Lỗi cú pháp parse mode (Telegram từ chối gửi tin nếu có thẻ HTML lỗi).
  * **Cách xử lý**: Kiểm tra log Vercel (`Function Logs`). Đảm bảo toàn bộ chuỗi động được bọc qua hàm `escapeHtml(text)`.

---

### 🔴 Sự cố 2: Bấm nút trên Bot bị xoay loading vô tận ("bị treo")
* **Nguyên nhân**: Bot không gọi `await ctx.answerCallbackQuery()` ngay ở đầu hàm xử lý sự kiện.
* **Cách xử lý**: Trong [[src/lib/telegram/bot.ts](file:///home/zinex/code/Bot-notice/src/lib/telegram/bot.ts)], lệnh `await ctx.answerCallbackQuery({ text: ... })` phải luôn được đặt ngay tại dòng đầu tiên của `bot.on("callback_query:data")` trước khi thực hiện bất kỳ thao tác cơ sở dữ liệu nào.

---

### 🔴 Sự cố 3: Đến giờ nhưng không thấy thông báo nhắc việc gửi về Telegram
* **Nguyên nhân 1**: cron-job.org chưa chạy hoặc gửi sai `x-cron-secret`.
  * **Cách xử lý**: Đăng nhập cron-job.org ➔ Xem mục **Execution History** (Lịch sử thực thi). Nếu có mã lỗi `401`, hãy kiểm tra lại giá trị header `x-cron-secret`. Nếu mã `200`, xem trường `sent` trong kết quả JSON trả về.
* **Nguyên nhân 2**: Tài khoản Telegram đang ở trạng thái Tạm dừng (`isPaused = true`).
  * **Cách xử lý**: Mở Telegram và gửi lệnh `/resume` để tiếp tục nhận thông báo.
* **Nguyên nhân 3**: Hoạt động đang bị tắt (`isActive = false`) hoặc đã được đánh dấu hoàn thành trước đó.

---

### 🔴 Sự cố 4: Lỗi cạn kiệt kết nối cơ sở dữ liệu (Prisma Connection Pool P1001 / P2024)
* **Nguyên nhân**: Serverless Functions tạo ra quá nhiều kết nối đồng thời mà không tái sử dụng Prisma Client.
* **Cách xử lý**:
  1. Đảm bảo `DATABASE_URL` sử dụng endpoint có `-pooler` của Neon.
  2. Kiểm tra [[src/lib/prisma.ts](file:///home/zinex/code/Bot-notice/src/lib/prisma.ts)]: Đảm bảo instance Prisma được gắn vào `globalThis.prisma` để tái sử dụng connection pool giữa các lần kích hoạt warm serverless function.

---

### 🔴 Sự cố 5: Lệch giờ thông báo (Ví dụ: đặt 08:00 nhưng 15:00 mới gửi)
* **Nguyên nhân**: Sử dụng sai múi giờ UTC thay vì giờ Việt Nam.
* **Cách xử lý**: Tuyệt đối không dùng `new Date().setHours(8, 0, 0, 0)`. Luôn sử dụng hàm `combineVietnamDateAndTime(dateStr, "08:00")` trong [[src/lib/schedule/engine.ts](file:///home/zinex/code/Bot-notice/src/lib/schedule/engine.ts)] để đảm bảo thời điểm tính toán luôn cộng đúng 7 tiếng (+07:00).
