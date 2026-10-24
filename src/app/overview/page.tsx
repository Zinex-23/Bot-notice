"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Droplets,
  Dumbbell,
  BookOpen,
  Flame,
  ArrowRight,
  Plus,
  Send,
  AlertCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { InstantReportButton } from "@/components/InstantReportButton";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = () => {
    fetch("/api/dashboard/overview")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error fetching overview:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleQuickWater = async (amountMl: number) => {
    try {
      await fetch("/api/water/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl }),
      });
      fetchOverview();
    } catch (err) {
      console.error("Error logging water:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        Đang tải bảng tổng quan DailyFlow...
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    waterConsumedMl: 0,
    waterTargetMl: 1500,
    waterRate: 0,
    exerciseMinutes: 0,
    studyMinutes: 0,
    currentStreak: 5,
  };

  const nextReminder = data?.nextReminder;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trợ lý cá nhân DailyFlow</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Chào mừng bạn đến với ngày mới!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Tất cả lịch nhắc và thói quen đều được đồng bộ hai chiều giữa Web Dashboard và Telegram Bot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <InstantReportButton variant="primary" />

          <Link
            href="/planner"
            className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Mở Lịch 24 Giờ</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tỷ lệ hoàn thành */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hoàn thành hôm nay
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
              {metrics.completionRate}%
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {metrics.completedTasks}/{metrics.totalTasks} việc
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              style={{ width: `${metrics.completionRate}%` }}
              className="bg-blue-600 h-full rounded-full transition-all"
            ></div>
          </div>
        </div>

        {/* Nước uống */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Uống nước
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
              {metrics.waterConsumedMl.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-400">ml</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Mục tiêu: {metrics.waterTargetMl.toLocaleString()} ml
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              style={{ width: `${metrics.waterRate}%` }}
              className="bg-cyan-500 h-full rounded-full transition-all"
            ></div>
          </div>
        </div>

        {/* Tập thể dục */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thể lực & Vận động
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
              {metrics.exerciseMinutes}{" "}
              <span className="text-sm font-normal text-slate-400">phút</span>
            </div>
            <span className="text-xs text-emerald-600 font-medium">Đạt mục tiêu</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Giữ cơ thể linh hoạt và giảm căng thẳng
          </div>
        </div>

        {/* Học tập & Công việc */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Học tập tập trung
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
              {metrics.studyMinutes}{" "}
              <span className="text-sm font-normal text-slate-400">phút</span>
            </div>
            <span className="text-xs text-violet-600 font-medium">Tập trung cao</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Duy trì chuỗi năng suất 5 ngày liên tiếp
          </div>
        </div>
      </div>

      {/* Middle Row: Next Reminder & Water Quick Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Upcoming Reminder Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Nhắc nhở tiếp theo
              </h2>
            </div>
            <Link
              href="/planner"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {nextReminder ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                    {nextReminder.time}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                    {nextReminder.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-2">
                  {nextReminder.title}
                </h3>
                {nextReminder.target && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mục tiêu: {nextReminder.target}
                  </p>
                )}
              </div>

              <Link
                href="/planner"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                Chi tiết
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
              🎉 Bạn đã hoàn thành tất cả nhắc nhở hôm nay!
            </div>
          )}
        </div>

        {/* Quick Water Widget */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Ghi nhận uống nước
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Bổ sung nước nhanh chóng mà không cần mở danh sách.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleQuickWater(250)}
                className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold hover:bg-cyan-100 transition-colors text-center"
              >
                +250 ml (1 Cốc)
              </button>
              <button
                onClick={() => handleQuickWater(500)}
                className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold hover:bg-cyan-100 transition-colors text-center"
              >
                +500 ml (1 Bình)
              </button>
            </div>
          </div>

          <Link
            href="/water"
            className="text-xs text-center text-slate-400 hover:text-cyan-600 transition-colors"
          >
            Mở trạm theo dõi uống nước đầy đủ →
          </Link>
        </div>
      </div>
    </div>
  );
}
