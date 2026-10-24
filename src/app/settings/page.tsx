"use client";

import { useEffect, useState } from "react";
import {
  Send,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Key,
  Clock,
  Shield,
  Save,
  Play,
  Pause,
} from "lucide-react";

export default function SettingsPage() {
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [reportConfig, setReportConfig] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [waterTarget, setWaterTarget] = useState(1500);

  const [isLoading, setIsLoading] = useState(true);
  const [isTestingReport, setIsTestingReport] = useState(false);
  const [testReportResult, setTestReportResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [tRes, rRes, sRes] = await Promise.all([
        fetch("/api/telegram/status").then((r) => r.json()),
        fetch("/api/reports/settings").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
      ]);
      setTelegramStatus(tRes);
      setReportConfig(rRes);
      setSettings(sRes.settings);
      setWaterTarget(sRes.settings?.waterTargetMl || 1500);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleGeneratePairingCode = async () => {
    try {
      const res = await fetch("/api/telegram/pairing-code", { method: "POST" });
      const data = await res.json();
      if (data.code) {
        setPairingCode(data.code);
        loadAll();
      }
    } catch (err) {
      console.error("Failed to generate code:", err);
    }
  };

  const handleUnpair = async () => {
    if (!confirm("Bạn có chắc muốn ngắt kết nối tài khoản Telegram này?")) return;
    try {
      await fetch("/api/telegram/unpair", { method: "POST" });
      setPairingCode(null);
      loadAll();
    } catch (err) {
      console.error("Failed to unpair:", err);
    }
  };

  const handleSaveReportConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/reports/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportConfig),
      });

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waterTargetMl: waterTarget }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save report config:", err);
    }
  };

  const handleTestReport = async () => {
    setIsTestingReport(true);
    setTestReportResult(null);
    try {
      const res = await fetch("/api/reports/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestReportResult(data.message || "Đã gửi thành công!");
      } else {
        setTestReportResult(`Lỗi: ${data.error}`);
      }
    } catch (err: unknown) {
      setTestReportResult(err instanceof Error ? err.message : "Gửi thất bại");
    } finally {
      setIsTestingReport(false);
    }
  };

  const handleResetSeed = async () => {
    if (
      !confirm(
        "Thao tác này sẽ nạp lại toàn bộ 11 hoạt động mặc định vào cơ sở dữ liệu. Bạn có muốn tiếp tục?"
      )
    )
      return;

    try {
      const res = await fetch("/api/settings/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      alert(data.message || "Đã nạp dữ liệu mẫu thành công!");
    } catch (err) {
      alert("Không thể nạp dữ liệu mẫu.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        Đang tải trang cài đặt DailyFlow...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
          <span>Cài Đặt Hệ Thống</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Cấu hình kết nối Telegram, báo cáo tự động, mục tiêu cá nhân và bảo mật.
        </p>
      </div>

      {/* 1. KẾT NỐI TELEGRAM BOT */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Kết nối Telegram Bot
              </h2>
              <p className="text-xs text-slate-400">
                Nhận thông báo lịch nhắc và đánh dấu hoàn thành tương tác trực tiếp
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              telegramStatus?.isPaired
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {telegramStatus?.isPaired ? "Đã liên kết" : "Chưa liên kết"}
          </span>
        </div>

        {telegramStatus?.isPaired ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
            <div className="text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-zinc-200">
                Tài khoản: @{telegramStatus.username || "Chưa đặt username"} (
                {telegramStatus.firstName || "Người dùng"})
              </p>
              <p className="text-slate-400">
                Đã kết nối lúc: {new Date(telegramStatus.pairedAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <button
              onClick={handleUnpair}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors"
            >
              Hủy kết nối
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Để bảo mật tài khoản cá nhân, DailyFlow sử dụng mã xác thực một lần (OTP 6 số) có hiệu lực trong 15 phút. Không cho phép nhập ID trực tiếp nếu không chứng minh quyền sở hữu.
            </p>

            {pairingCode || telegramStatus?.pairingCode ? (
              <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  MÃ KẾT NỐI MỘT LẦN CỦA BẠN:
                </span>
                <div className="font-mono text-3xl font-black text-blue-600 tracking-wider">
                  {pairingCode || telegramStatus?.pairingCode}
                </div>
                <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-1">
                  <p>1. Mở ứng dụng Telegram và tìm bot của bạn.</p>
                  <p>
                    2. Gửi lệnh sau đến bot:{" "}
                    <code className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 font-bold text-blue-600">
                      /start {pairingCode || telegramStatus?.pairingCode}
                    </code>
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGeneratePairingCode}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Tạo mã kết nối Telegram</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. CẤU HÌNH BÁO CÁO TỰ ĐỘNG & MỤC TIÊU NƯỚC */}
      <form
        onSubmit={handleSaveReportConfig}
        className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Báo cáo tự động (Reports)
              </h2>
              <p className="text-xs text-slate-400">
                Thiết lập thời gian gửi báo cáo tổng kết Ngày, Tuần và Tháng qua Telegram
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestReport}
            disabled={isTestingReport || !telegramStatus?.isPaired}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 disabled:opacity-50 transition-colors"
          >
            {isTestingReport ? "Đang gửi..." : "Gửi báo cáo thử"}
          </button>
        </div>

        {testReportResult && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900">
            {testReportResult}
          </div>
        )}

        {/* Báo cáo ngày */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Báo cáo tổng kết ngày (Daily Report)
              </span>
              <p className="text-xs text-slate-400">
                Gửi tổng kết các việc đã xong, lượng nước và chuỗi thói quen
              </p>
            </div>
            <input
              type="checkbox"
              checked={reportConfig?.dailyEnabled ?? true}
              onChange={(e) =>
                setReportConfig({ ...reportConfig, dailyEnabled: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Giờ gửi báo cáo (Mặc định: 22:00)
              </label>
              <input
                type="time"
                value={reportConfig?.dailyTime || "22:00"}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, dailyTime: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Mục tiêu nước hàng ngày (ml)
              </label>
              <input
                type="number"
                step="50"
                value={waterTarget}
                onChange={(e) => setWaterTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Báo cáo tuần */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Báo cáo tuần (Weekly Report)
              </span>
              <p className="text-xs text-slate-400">
                Tổng hợp xu hướng 7 ngày và so sánh với tuần trước
              </p>
            </div>
            <input
              type="checkbox"
              checked={reportConfig?.weeklyEnabled ?? true}
              onChange={(e) =>
                setReportConfig({ ...reportConfig, weeklyEnabled: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Ngày gửi trong tuần
              </label>
              <select
                value={reportConfig?.weeklyDay ?? 0}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, weeklyDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              >
                <option value={0}>Chủ Nhật (Mặc định)</option>
                <option value={1}>Thứ Hai</option>
                <option value={5}>Thứ Sáu</option>
                <option value={6}>Thứ Bảy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Giờ gửi (Mặc định: 21:45)
              </label>
              <input
                type="time"
                value={reportConfig?.weeklyTime || "21:45"}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, weeklyTime: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Báo cáo tháng */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Báo cáo tháng (Monthly Report)
              </span>
              <p className="text-xs text-slate-400">
                Gửi vào ngày cuối cùng của tháng kèm bản đồ nhiệt thói quen
              </p>
            </div>
            <input
              type="checkbox"
              checked={reportConfig?.monthlyEnabled ?? true}
              onChange={(e) =>
                setReportConfig({ ...reportConfig, monthlyEnabled: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Giờ gửi ngày cuối tháng (Mặc định: 22:15)
              </label>
              <input
                type="time"
                value={reportConfig?.monthlyTime || "22:15"}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, monthlyTime: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã lưu cài đặt thành công!</span>
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      </form>

      {/* 3. DỮ LIỆU BAN ĐẦU & SEED KHỞI TẠO */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center space-x-2">
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Dữ liệu mẫu ban đầu</span>
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          DailyFlow lưu trữ toàn bộ lịch trình động trong cơ sở dữ liệu PostgreSQL. Bạn có thể tự do chỉnh sửa, kéo thả hoặc xóa bất kỳ hoạt động nào trên website mà không bao giờ cần sửa mã nguồn. Nếu muốn nạp lại bộ lịch trình khởi đầu, hãy nhấn nút dưới đây.
        </p>

        <button
          onClick={handleResetSeed}
          className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Nạp lại lịch trình mẫu (11 hoạt động)
        </button>
      </div>
    </div>
  );
}
