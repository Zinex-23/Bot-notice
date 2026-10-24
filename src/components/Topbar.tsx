"use client";

import { useEffect, useState } from "react";
import { Clock, Send, Menu, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { InstantReportButton } from "./InstantReportButton";
import Link from "next/link";

interface TelegramStatus {
  isPaired: boolean;
  username?: string | null;
  firstName?: string | null;
  isPaused?: boolean;
}

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
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
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Telegram connection status
  useEffect(() => {
    fetch("/api/telegram/status")
      .then((res) => res.json())
      .then((data) => setTelegramStatus(data))
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Mobile Hamburger & Live Date/Time */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 text-sm min-w-0">
        {/* Hamburger Menu Toggle (Visible on mobile/tablet) */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Live Clock (Vietnam Time) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-800 dark:text-zinc-200 font-medium">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="font-mono text-sm sm:text-base font-bold tracking-tight">
            {currentTime || "--:--:--"}
          </span>
        </div>

        <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">|</span>
        <span className="capitalize text-slate-500 dark:text-zinc-400 text-xs hidden sm:inline truncate">
          {currentDate}
        </span>
        <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
          GMT+7 (VN)
        </span>
      </div>

      {/* Right: Instant Report Action & Status Badges */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* INSTANT REPORT BUTTON (Gửi báo cáo ngay) */}
        <InstantReportButton variant="topbar" />

        {/* Telegram Status Badge */}
        <Link
          href="/settings"
          title={
            telegramStatus?.isPaired
              ? `Telegram: Đã kết nối (@${telegramStatus.username || telegramStatus.firstName || "bạn"})`
              : "Telegram: Chưa liên kết"
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            telegramStatus?.isPaired
              ? telegramStatus.isPaused
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <Send className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden md:inline">
            {telegramStatus?.isPaired
              ? telegramStatus.isPaused
                ? "Bot tạm dừng"
                : "Bot kết nối"
              : "Chưa kết nối"}
          </span>
        </Link>

        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Security badge (desktop only) */}
        <div
          title="DailyFlow Hệ Thống Cá Nhân An Toàn"
          className="hidden sm:flex w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
