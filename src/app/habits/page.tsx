"use client";

import { useEffect, useState } from "react";
import { Flame, Award, CheckCircle2, Plus, Sparkles, TrendingUp } from "lucide-react";

const INITIAL_HABITS = [
  {
    id: "h1",
    name: "Uống đủ 1.500 ml nước",
    category: "WATER",
    streak: 7,
    longestStreak: 14,
    days: [true, true, true, true, true, true, true],
  },
  {
    id: "h2",
    name: "Tập thể dục tối thiểu 30 phút",
    category: "EXERCISE",
    streak: 5,
    longestStreak: 10,
    days: [true, false, true, true, true, true, true],
  },
  {
    id: "h3",
    name: "Học tập hoặc đọc sách 60 phút",
    category: "STUDY",
    streak: 4,
    longestStreak: 8,
    days: [false, true, true, true, true, true, false],
  },
  {
    id: "h4",
    name: "Đi ngủ trước 23:00",
    category: "HEALTH",
    streak: 3,
    longestStreak: 6,
    days: [true, true, false, true, true, true, true],
  },
];

export default function HabitsPage() {
  const [habits] = useState(INITIAL_HABITS);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
          <Flame className="w-6 h-6 text-amber-500" />
          <span>Theo Dõi Thói Quen & Chuỗi Ngày</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Xây dựng kỷ luật thông qua chuỗi ngày duy trì liên tục (Habit Streaks).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Chuỗi kỷ lục cao nhất
          </span>
          <div className="text-3xl font-black text-amber-500 mt-2 flex items-center space-x-2">
            <span>🔥 14</span>
            <span className="text-sm font-normal text-slate-400">ngày</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 inline-block">Thói quen uống nước</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Điểm kỷ luật tuần
          </span>
          <div className="text-3xl font-black text-blue-600 mt-2">
            88%
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            +5% so với tuần trước
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Huy hiệu năng suất
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-2 flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Master Consistency</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 inline-block">Cấp độ 3</span>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  {habit.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {habit.category}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                <span className="font-semibold text-amber-500">🔥 Chuỗi: {habit.streak} ngày</span>
                <span>• Kỷ lục: {habit.longestStreak} ngày</span>
              </div>
            </div>

            {/* 7-Day Completion Dots */}
            <div className="flex items-center space-x-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label, idx) => {
                const done = habit.days[idx];
                return (
                  <div key={label} className="text-center">
                    <span className="block text-[10px] text-slate-400 mb-1">{label}</span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        done
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600"
                      }`}
                    >
                      {done ? "✓" : "•"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
