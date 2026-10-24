"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, Clock, Send, Sparkles } from "lucide-react";

export default function HistoryPage() {
  const [completions, setCompletions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((res) => res.json())
      .then((data) => {
        setCompletions(data.recentCompletions || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
          <History className="w-6 h-6 text-blue-600" />
          <span>Lịch Sử Hoàn Thành & Nhật Ký</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Hồ sơ kiểm toán lịch sử hoàn thành công việc từ cả Website và Telegram Bot.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-zinc-800">
        <div className="p-5 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>HOẠT ĐỘNG HOÀN THÀNH GẦN ĐÂY</span>
          <span>NGUỒN & THỜI ĐIỂM</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Đang tải lịch sử...</div>
        ) : completions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Chưa có lịch sử hoàn thành nào được ghi nhận.
          </div>
        ) : (
          completions.map((comp) => (
            <div
              key={comp.id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                    {comp.task?.title || "Công việc"}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                    <span>{comp.task?.category}</span>
                    {comp.value && (
                      <span>
                        • Đạt: {comp.value} {comp.task?.targetUnit || ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                    comp.source === "TELEGRAM"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                      : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {comp.source === "TELEGRAM" ? "Telegram Bot" : "Website Dashboard"}
                </span>
                <p className="text-xs text-slate-400 font-mono">
                  {new Date(comp.completedAt).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
