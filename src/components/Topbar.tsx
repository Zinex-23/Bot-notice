"use client";

import { useEffect, useState } from "react";
import { Bell, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

interface TelegramStatus {
  isPaired: boolean;
  username?: string | null;
  isPaused?: boolean;
}

export function Topbar() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);

  // Live ticking clock in Vietnam timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Telegram status
  useEffect(() => {
    fetch("/api/telegram/status")
      .then((res) => res.json())
      .then((data) => setTelegramStatus(data))
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Date & Time in Vietnam */}
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-zinc-200 font-medium">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-mono text-base font-semibold">{currentTime || "--:--:--"}</span>
        </div>
        <span className="text-slate-300 dark:text-zinc-700">|</span>
        <span className="capitalize text-slate-500 dark:text-zinc-400 hidden sm:inline">
          {currentDate || "Đang tải ngày..."}
        </span>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
          Asia/Ho_Chi_Minh (GMT+7)
        </span>
      </div>

      {/* Right: Status Indicators & Actions */}
      <div className="flex items-center space-x-3">
        {/* Telegram Status Badge */}
        <Link
          href="/settings"
          title={
            telegramStatus?.isPaired
              ? `Telegram: Đã kết nối (@${telegramStatus.username || "bạn"})`
              : "Telegram: Chưa liên kết"
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            telegramStatus?.isPaired
              ? telegramStatus.isPaused
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {telegramStatus?.isPaired
              ? telegramStatus.isPaused
                ? "Bot tạm dừng"
                : "Bot đã kết nối"
              : "Chưa kết nối Bot"}
          </span>
        </Link>

        {/* Notification Status */}
        <div
          title="Trạng thái hệ thống nhắc việc: Đang hoạt động"
          className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700"
        >
          <Bell className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Nhắc nhở: Sẵn sàng</span>
        </div>

        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Security badge */}
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
