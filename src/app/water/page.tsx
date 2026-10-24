"use client";

import { useEffect, useState } from "react";
import { Droplets, Plus, Sparkles, Check, Clock } from "lucide-react";
import { getVietnamDateString } from "@/lib/schedule/engine";

export default function WaterPage() {
  const [data, setData] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchWater = () => {
    fetch("/api/water")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error fetching water:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchWater();
  }, []);

  const handleAddWater = async (amountMl: number) => {
    try {
      await fetch("/api/water/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl }),
      });
      fetchWater();
      setCustomAmount("");
    } catch (err) {
      console.error("Error adding water:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        Đang tải dữ liệu uống nước...
      </div>
    );
  }

  const total = data?.totalConsumed || 0;
  const target = data?.target || 1500;
  const percentage = Math.min(100, Math.round((total / target) * 100));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
          <Droplets className="w-6 h-6 text-cyan-600" />
          <span>Theo Dõi Uống Nước</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Ghi nhận lượng nước nạp vào cơ thể và đồng bộ trực tiếp với Telegram Bot.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual Water Meter Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
          {/* Animated Water Circle */}
          <div className="relative w-48 h-48 rounded-full border-4 border-cyan-100 dark:border-cyan-950 flex items-center justify-center overflow-hidden shadow-inner my-4">
            {/* Water Wave Level */}
            <div
              style={{ height: `${percentage}%` }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 to-cyan-400 opacity-80 transition-all duration-700 ease-out"
            ></div>

            {/* Percentage Text */}
            <div className="relative z-10 text-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">
                {percentage}%
              </span>
              <span className="block text-xs font-semibold text-slate-600 dark:text-zinc-200 mt-1">
                {total.toLocaleString()} / {target.toLocaleString()} ml
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-xs mt-2">
            Mục tiêu khuyến nghị tối thiểu 1.500 ml mỗi ngày để cơ thể luôn tràn đầy năng lượng.
          </p>
        </div>

        {/* Quick Log & Controls */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-3">
              Ghi nhận nhanh
            </h2>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                onClick={() => handleAddWater(150)}
                className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 font-semibold text-xs hover:bg-cyan-100 transition-colors"
              >
                +150 ml (Tách nhỏ)
              </button>
              <button
                onClick={() => handleAddWater(250)}
                className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 font-semibold text-xs hover:bg-cyan-100 transition-colors"
              >
                +250 ml (1 Cốc tiêu chuẩn)
              </button>
              <button
                onClick={() => handleAddWater(350)}
                className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 font-semibold text-xs hover:bg-cyan-100 transition-colors"
              >
                +350 ml (1 Cốc lớn)
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 font-semibold text-xs hover:bg-cyan-100 transition-colors"
              >
                +500 ml (1 Bình nước)
              </button>
            </div>

            {/* Custom Amount */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Hoặc nhập số lượng tùy chọn:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="50"
                  step="50"
                  placeholder="Ví dụ: 300"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={() => customAmount && handleAddWater(Number(customAmount))}
                  disabled={!customAmount}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                >
                  Nạp nước
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            💡 Bạn cũng có thể bấm nút trực tiếp trong Telegram bot khi nhận thông báo.
          </p>
        </div>
      </div>

      {/* History Log Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-600" />
          <span>Nhật ký uống nước hôm nay ({data?.logs?.length || 0} lần)</span>
        </h2>

        {data?.logs?.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl">
            Chưa có lần uống nước nào được ghi nhận hôm nay.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {data.logs.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center font-bold text-xs">
                    🥛
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    +{log.amountMl} ml
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">
                    {log.source === "TELEGRAM" ? "Từ Telegram Bot" : "Từ Website"}
                  </span>
                  <span>
                    {new Date(log.loggedAt).toLocaleTimeString("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
