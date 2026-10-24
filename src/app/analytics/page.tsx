"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Droplets,
  Dumbbell,
  BookOpen,
  Flame,
  Award,
  CheckCircle2,
} from "lucide-react";
import { InstantReportButton } from "@/components/InstantReportButton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#64748b"];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/dashboard/overview").then((r) => r.json()),
      fetch("/api/dashboard/weekly").then((r) => r.json()),
      fetch("/api/dashboard/monthly").then((r) => r.json()),
    ])
      .then(([daily, weekly, monthly]) => {
        setDailyData(daily);
        setWeeklyData(weekly);
        setMonthlyData(monthly);
      })
      .catch((err) => console.error("Error loading analytics:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        Đang tổng hợp số liệu thống kê đa chiều...
      </div>
    );
  }

  // Category breakdown for Pie Chart
  const pieData = dailyData?.categoryCounts
    ? Object.entries(dailyData.categoryCounts).map(([name, val]: [string, any]) => ({
        name,
        value: val.total,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Thống Kê Năng Suất</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Phân tích thói quen, tiến độ hoàn thành và biểu đồ xu hướng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <InstantReportButton variant="outline" />

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setTab("DAILY")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === "DAILY"
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setTab("WEEKLY")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === "WEEKLY"
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              7 Ngày qua
            </button>
            <button
              onClick={() => setTab("MONTHLY")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === "MONTHLY"
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>
      </div>

      {/* WEEKLY VIEW */}
      {tab === "WEEKLY" && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tỷ lệ hoàn thành tuần
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">
                {weeklyData?.summary?.weeklyRate || 0}%
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                {weeklyData?.summary?.comparedToLastWeek || "+0%"} so với tuần trước
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tổng việc đã hoàn tất
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">
                {weeklyData?.summary?.totalDone || 0} / {weeklyData?.summary?.totalScheduled || 0}
              </div>
              <span className="text-xs text-slate-400 mt-1 inline-block">7 ngày qua</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nước uống trung bình
              </span>
              <div className="text-3xl font-extrabold text-cyan-600 mt-2">
                {(weeklyData?.summary?.averageWaterMl || 0).toLocaleString()} ml
              </div>
              <span className="text-xs text-slate-400 mt-1 inline-block">mỗi ngày</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thể dục & Học tập
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">
                {weeklyData?.summary?.totalExerciseMin || 0}p / {weeklyData?.summary?.totalStudyMin || 0}p
              </div>
              <span className="text-xs text-slate-400 mt-1 inline-block">Tổng giờ tập & học</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Completion Rate Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-4">
                Tỷ lệ hoàn thành theo ngày (%)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData?.days || []}>
                    <XAxis dataKey="dayOfWeek" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        background: "#1e293b",
                        border: "none",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Water Trend Line Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-4">
                Xu hướng uống nước (ml)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData?.days || []}>
                    <XAxis dataKey="dayOfWeek" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        background: "#1e293b",
                        border: "none",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="waterMl"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAILY VIEW */}
      {tab === "DAILY" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-4">
              Cơ cấu hoạt động theo danh mục
            </h2>
            <div className="h-64 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">Chưa có dữ liệu danh mục hôm nay</p>
              )}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-3">
                Thành tích hôm nay
              </h2>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    Nhiệm vụ hoàn thành
                  </span>
                  <span className="font-extrabold text-blue-600">
                    {dailyData?.metrics?.completedTasks || 0} / {dailyData?.metrics?.totalTasks || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    Chuỗi năng suất hiện tại
                  </span>
                  <span className="font-extrabold text-amber-500">
                    🔥 {dailyData?.metrics?.currentStreak || 5} ngày
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    Lượng nước đã nạp
                  </span>
                  <span className="font-extrabold text-cyan-500">
                    {(dailyData?.metrics?.waterConsumedMl || 0).toLocaleString()} ml
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY VIEW (HEATMAP) */}
      {tab === "MONTHLY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
              Bản đồ nhiệt thói quen tháng {monthlyData?.month}/{monthlyData?.year}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Màu xanh đậm thể hiện ngày hoàn thành trên 80% mục tiêu đã đề ra.
            </p>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthlyData?.heatmap?.map((cell: any) => {
                let bg = "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400";
                if (cell.rate >= 80) {
                  bg = "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20";
                } else if (cell.rate >= 40) {
                  bg = "bg-blue-300 text-blue-900 font-semibold";
                } else if (cell.rate > 0) {
                  bg = "bg-blue-100 text-blue-700 font-medium";
                }

                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.completed}/${cell.total} việc (${cell.rate}%) - ${cell.waterTotal}ml`}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center p-1 text-xs transition-all ${bg}`}
                  >
                    <span>{cell.dayNumber}</span>
                    <span className="text-[10px] opacity-80">{cell.rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
