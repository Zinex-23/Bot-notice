"use client";

import { useState } from "react";
import { X, Clock, Calendar, Bell, Target, Sparkles } from "lucide-react";
import { TaskCategory, TaskPriority } from "@/lib/schedule/types";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStartTime?: string;
  defaultDate?: string;
}

export function AddReminderModal({
  isOpen,
  onClose,
  onSuccess,
  initialStartTime = "09:00",
  defaultDate,
}: AddReminderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("OTHER");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [startTime, setStartTime] = useState(initialStartTime);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [startDate, setStartDate] = useState(defaultDate || "");
  const [recurrenceType, setRecurrenceType] = useState("DAILY");
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetValue, setTargetValue] = useState<number | "">("");
  const [targetUnit, setTargetUnit] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [allowSnooze, setAllowSnooze] = useState(true);
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tên hoạt động.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          priority,
          startTime,
          durationMinutes: Number(durationMinutes) || 0,
          startDate: startDate || undefined,
          recurrenceType,
          recurrenceDays: recurrenceType === "CUSTOM" ? customDays : undefined,
          targetValue: targetValue === "" ? undefined : Number(targetValue),
          targetUnit: targetUnit || undefined,
          telegramEnabled,
          allowSnooze,
          snoozeMinutes: Number(snoozeMinutes) || 15,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi tạo lịch nhắc");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const dayLabels = [
    { num: 1, label: "T2" },
    { num: 2, label: "T3" },
    { num: 3, label: "T4" },
    { num: 4, label: "T5" },
    { num: 5, label: "T6" },
    { num: 6, label: "T7" },
    { num: 0, label: "CN" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Thêm lịch nhắc mới
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Tên hoạt động */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Tên hoạt động <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Uống nước, Tập thể dục, Họp nhóm..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm về mục tiêu, hướng dẫn thực hiện..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Danh mục & Độ ưu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="WATER">💧 Uống nước</option>
                <option value="EXERCISE">🏋️ Tập thể dục</option>
                <option value="STUDY">📚 Học tập</option>
                <option value="WORK">💼 Công việc</option>
                <option value="HEALTH">🧘 Sức khỏe</option>
                <option value="OTHER">🎯 Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
              </select>
            </div>
          </div>

          {/* Giờ nhắc & Thời lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Giờ nhắc (00:00 - 23:59) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Thời lượng (phút)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Quy tắc lặp lại */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Lặp lại
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="DAILY">Hằng ngày (Mỗi ngày)</option>
              <option value="WEEKDAYS">Thứ 2 – Thứ 6 (Các ngày trong tuần)</option>
              <option value="WEEKENDS">Cuối tuần (Thứ 7 & Chủ nhật)</option>
              <option value="CUSTOM">Tùy chọn ngày trong tuần</option>
              <option value="WEEKLY">Hằng tuần</option>
              <option value="MONTHLY">Hằng tháng</option>
              <option value="ONCE">Một lần duy nhất</option>
            </select>
          </div>

          {/* Chọn ngày tùy chỉnh nếu là CUSTOM */}
          {recurrenceType === "CUSTOM" && (
            <div className="flex items-center space-x-2 pt-1">
              {dayLabels.map((d) => (
                <button
                  type="button"
                  key={d.num}
                  onClick={() => toggleDay(d.num)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                    customDays.includes(d.num)
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Mục tiêu & Đơn vị */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Mục tiêu định lượng
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ví dụ: 250, 30, 10..."
                value={targetValue}
                onChange={(e) =>
                  setTargetValue(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Đơn vị tính
              </label>
              <input
                type="text"
                placeholder="ml, phút, lần, trang..."
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Thông báo Telegram & Nhắc lại */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                  Gửi thông báo Telegram
                </span>
                <p className="text-xs text-slate-400">
                  Gửi tin nhắn kèm nút bấm tương tác đến bot
                </p>
              </div>
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                  Cho phép nhắc lại (Snooze)
                </span>
                <p className="text-xs text-slate-400">
                  Bật nút nhắc lại sau 15 phút trên Telegram & Website
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowSnooze}
                onChange={(e) => setAllowSnooze(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? "Đang lưu..." : "Lưu lịch nhắc"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
