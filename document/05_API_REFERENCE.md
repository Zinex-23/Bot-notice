# 📡 05. DANH MỤC CHI TIẾT TOÀN BỘ API (API REFERENCE)

Tài liệu này liệt kê đầy đủ 25+ Route Handlers (RESTful API) của dự án, bao gồm phương thức HTTP, đường dẫn, tham số đầu vào và định dạng phản hồi chuẩn.

---

## 1. XÁC THỰC & PHIÊN LÀM VIỆC (AUTHENTICATION)

### `POST /api/auth/login`
- **Mục đích**: Xác thực người dùng bằng mã PIN cá nhân (`ADMIN_PIN`).
- **Body**: `{ "pin": "123456" }`
- **Response**: `{ "success": true, "user": { ... } }` (Tự động set cookie `dailyflow_session`).

### `POST /api/auth/logout`
- **Mục đích**: Đăng xuất, xóa cookie session.
- **Response**: `{ "success": true }`

### `GET /api/auth/me`
- **Mục đích**: Lấy thông tin người dùng đang đăng nhập từ session token.
- **Response**: `{ "user": { "id": "...", "name": "...", "email": "..." } }`

---

## 2. LẬP KẾ HOẠCH & LỊCH TRÌNH 24H (PLANNER & SCHEDULE)

### `GET /api/planner?date=YYYY-MM-DD`
- **Mục đích**: Lấy toàn bộ danh sách hoạt động, xung đột và chỉ số tổng hợp của ngày được chọn.
- **Response**:
  ```json
  {
    "date": "2026-10-24",
    "items": [
      {
        "id": "task_id",
        "occurrenceId": "occ_id",
        "title": "Chạy bộ sáng",
        "category": "EXERCISE",
        "startTime": "06:00",
        "durationMinutes": 45,
        "status": "COMPLETED",
        "hasConflict": false
      }
    ],
    "conflicts": [],
    "summary": {
      "totalTasks": 11,
      "completedTasks": 8,
      "completionRate": 73,
      "waterConsumedMl": 1250
    }
  }
  ```

### `POST /api/planner`
- **Mục đích**: Tạo một hoạt động mới kèm khung giờ lặp.
- **Body**:
  ```json
  {
    "title": "Đọc sách phát triển bản thân",
    "description": "Đọc tối thiểu 20 trang sách",
    "category": "STUDY",
    "priority": "HIGH",
    "startTime": "21:00",
    "durationMinutes": 30,
    "recurrenceType": "DAILY",
    "recurrenceDays": [0, 1, 2, 3, 4, 5, 6],
    "targetValue": 20,
    "targetUnit": "trang",
    "telegramEnabled": true
  }
  ```

### `POST /api/planner/:id/reschedule`
- **Mục đích**: Kéo-thả dời giờ hoạt động (Occurrence) sang khung giờ mới.
- **Body**: `{ "newStartTime": "14:30" }`
- **Hành vi**: Cập nhật `scheduledAt`, hủy `NotificationJob` cũ và tạo `NotificationJob` mới tại 14:30.

### `POST /api/planner/:id/complete`
- **Mục đích**: Đánh dấu hoàn thành phiên hoạt động từ Web.
- **Body**: `{ "value": 1 }` (Tùy chọn)

### `POST /api/planner/:id/toggle`
- **Mục đích**: Bật hoặc tắt trạng thái hoạt động của Task.
- **Body**: `{ "isActive": false }`

### `DELETE /api/planner/:id?scope=ALL`
- **Mục đích**: Xóa lịch nhắc.
  - `scope=THIS_OCCURRENCE`: Chỉ bỏ qua phiên ngày hôm nay.
  - `scope=ALL`: Soft-delete Task, hủy toàn bộ thông báo tương lai.

---

## 3. QUẢN LÝ CÔNG VIỆC & THÓI QUEN (TASKS)

### `GET /api/tasks`
- **Mục đích**: Lấy danh sách toàn bộ các Task kèm cấu hình lịch lặp `schedules`.

### `POST /api/tasks`
- **Mục đích**: Tạo mới công việc từ trang Quản lý công việc.

---

## 4. THEO DÕI NƯỚC UỐNG (WATER INTAKE)

### `GET /api/water?date=YYYY-MM-DD`
- **Mục đích**: Lấy tổng lượng nước đã uống trong ngày, mục tiêu cá nhân và lịch sử các lần uống.
- **Response**:
  ```json
  {
    "date": "2026-10-24",
    "totalConsumed": 1250,
    "target": 1500,
    "percentage": 83,
    "intakes": [
      { "id": "...", "amountMl": 250, "source": "TELEGRAM", "loggedAt": "..." },
      { "id": "...", "amountMl": 500, "source": "WEB", "loggedAt": "..." }
    ]
  }
  ```

### `POST /api/water/log`
- **Mục đích**: Ghi nhận một lần uống nước mới từ Web Dashboard.
- **Body**: `{ "amountMl": 250 }`

---

## 5. KẾT NỐI TELEGRAM BOT (TELEGRAM)

### `POST /api/telegram/pairing-code`
- **Mục đích**: Sinh mã OTP kết nối 6 chữ số ngẫu nhiên (hạn 15 phút).
- **Response**: `{ "code": "995882", "expiresAt": "2026-10-24T17:15:00.000Z" }`

### `GET /api/telegram/status`
- **Mục đích**: Kiểm tra tình trạng kết nối Telegram của người dùng hiện tại.
- **Response**:
  ```json
  {
    "isPaired": true,
    "username": "midori23",
    "firstName": "24",
    "pairedAt": "2026-10-24T09:23:53.611Z",
    "isActive": true,
    "isPaused": false
  }
  ```

### `POST /api/telegram/unpair`
- **Mục đích**: Ngắt kết nối Telegram khỏi tài khoản DailyFlow.

### `POST /api/telegram/setup-webhook`
- **Mục đích**: 1-Click đăng ký Webhook URL với Telegram API Gateway.
- **Response**: `{ "success": true, "webhookUrl": "https://.../api/telegram/webhook" }`

### `POST /api/telegram/webhook`
- **Mục đích**: Điểm nhận sự kiện (Webhook Receiver) từ máy chủ Telegram khi người dùng gõ lệnh hoặc bấm nút.

---

## 6. BÁO CÁO & THỐNG KÊ (REPORTS & DASHBOARD)

### `POST /api/reports/send-now` & `POST /api/reports/test`
- **Mục đích**: Kích hoạt gửi báo cáo tổng kết ngày hôm nay ngay lập tức tới Telegram của người dùng.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đã gửi báo cáo tổng kết tới Telegram (@midori23) thành công!"
  }
  ```

### `GET /api/reports/settings`
- **Mục đích**: Lấy cấu hình lịch gửi báo cáo Ngày, Tuần, Tháng.

### `PATCH /api/reports/settings`
- **Mục đích**: Lưu cập nhật giờ gửi báo cáo (ví dụ đổi Daily từ `22:00` sang `21:30`).

### `GET /api/dashboard/overview`
- **Mục đích**: Trả về 4 thẻ chỉ số KPI chính và lịch nhắc tiếp theo cho trang chủ.

### `GET /api/dashboard/weekly`
- **Mục đích**: Trả về dữ liệu biểu đồ 7 ngày gần nhất (tỷ lệ hoàn thành, thể dục, nước).

### `GET /api/dashboard/monthly`
- **Mục đích**: Trả về ma trận dữ liệu bản đồ nhiệt (Heatmap) theo từng ngày trong tháng.

---

## 7. ĐIỀU PHỐI CRON (CRON SYSTEM)

> [!WARNING]
> Mọi yêu cầu đến nhóm API này bắt buộc phải có header `x-cron-secret`.

### `POST /api/cron/dispatch`
- **Header**: `x-cron-secret: <CRON_SECRET>`
- **Mục đích**: Kiểm tra và gửi toàn bộ các `NotificationJob` đến hạn sang Telegram. Kiểm tra kích hoạt báo cáo tự động.
- **Tần suất gọi**: Mỗi 1 phút (`* * * * *`) qua cron-job.org.
- **Response**: `{ "processed": 3, "sent": 3, "skipped": 0, "failed": 0 }`

### `POST /api/cron/prepare-day`
- **Header**: `x-cron-secret: <CRON_SECRET>`
- **Mục đích**: Chạy lúc 00:05 mỗi ngày để đồng bộ trước các phiên `TaskOccurrence` và `NotificationJob` cho ngày mới.

---

## 8. CÀI ĐẶT & DỮ LIỆU MẪU (SETTINGS & SEED)

### `GET /api/settings` & `PATCH /api/settings`
- **Mục đích**: Đọc và cập nhật mục tiêu nước hàng ngày (`waterTargetMl`), theme, múi giờ.

### `POST /api/settings/seed`
- **Mục đích**: Nạp lại 11 hoạt động mặc định vào cơ sở dữ liệu nếu người dùng muốn khôi phục lịch mẫu ban đầu.
