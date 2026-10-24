"use client";

import { useEffect, useState } from "react";
import { getVietnamDateString } from "@/lib/schedule/engine";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";

interface WeeklyViewProps {
  onSelectItemDate?: (dateStr: string) => void;
}

export function WeeklyView({ onSelectItemDate }: WeeklyViewProps) {
  const [weekData, setWeekData] = useState<any[]>([]);
  const [todayStr, setTodayStr] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTodayStr(getVietnamDateString());
    fetch("/api/dashboard/weekly")
      .then((res) => res.json())
      .then((data) => {
        setWeekData(data.days || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-slate-400">
        Đang tải lịch tuần...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekData.map((day) => {
          const isToday = day.date === todayStr;

          return (
            <div
              key={day.date}
              onClick={() => onSelectItemDate?.(day.date)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isToday
                  ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {day.dayOfWeek}
                </span>
                {isToday && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white">
                    Hôm nay
                  </span>
                )}
              </div>

              <div className="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-2">
                {day.date.split("-")[2]}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Hoàn thành:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {day.completed}/{day.total}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${day.rate}%` }}
                    className="bg-blue-600 h-full rounded-full transition-all"
                  ></div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>💧 {day.waterMl} ml</span>
                  <span>🏋️ {day.exerciseMinutes}p</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
