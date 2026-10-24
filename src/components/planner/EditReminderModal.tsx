"use client";

import { useState } from "react";
import { X, Clock, CheckCircle2, Trash2, Pause, Play, RefreshCw, AlertTriangle } from "lucide-react";
import { TimeSlotItem, TaskCategory, TaskPriority } from "@/lib/schedule/types";

interface EditReminderModalProps {
  item: TimeSlotItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditReminderModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: EditReminderModalProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [category, setCategory] = useState<TaskCategory>(item?.category || "OTHER");
  const [priority, setPriority] = useState<TaskPriority>(item?.priority || "MEDIUM");
  const [startTime, setStartTime] = useState(item?.startTime || "09:00");
  const [durationMinutes, setDurationMinutes] = useState(item?.durationMinutes || 0);
  const [targetValue, setTargetValue] = useState<number | "">(item?.targetValue ?? "");
  const [targetUnit, setTargetUnit] = useState(item?.targetUnit || "");
  const [telegramEnabled, setTelegramEnabled] = useState(item?.telegramEnabled ?? true);
  const [scope, setScope] = useState<"THIS_OCCURRENCE" | "THIS_AND_FUTURE" | "ALL">(
    "ALL"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/planner/${item.taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          startTime,
          durationMinutes: Number(durationMinutes) || 0,
          targetValue: targetValue === "" ? undefined : Number(targetValue),
          targetUnit,
          telegramEnabled,
          scope,
          occurrenceId: item.occurrenceId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi cập nhật");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!item.occurrenceId) return;
    setIsLoading(true);
    try {
      await fetch(`/api/planner/${item.occurrenceId}/complete`, {
        method: "POST",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Không thể đánh dấu hoàn thành");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnooze = async () => {
    if (!item.occurrenceId) return;
    setIsLoading(true);
    try {
      await fetch(`/api/planner/${item.occurrenceId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStartTime: startTime,
        }),
      });
      onSuccess();
      onClose();
    } catch {
      setError("Không thể nhắc lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/planner/${item.taskId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      onSuccess();
      onClose();
    } catch {
      setError("Không thể thay đổi trạng thái");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (deleteScope: "THIS_OCCURRENCE" | "ALL") => {
    setIsLoading(true);
    try {
      await fetch(
        `/api/planner/${item.taskId}?scope=${deleteScope}&occurrenceId=${item.occurrenceId || ""}`,
        { method: "DELETE" }
      );
      onSuccess();
      onClose();
    } catch {
      setError("Không thể xóa lịch nhắc");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Chi tiết lịch nhắc
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Thời gian: {item.startTime} {item.durationMinutes ? `(${item.durationMinutes} phút)` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Ribbon */}
        <div className="px-6 py-3 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/30 dark:bg-zinc-800/20 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleComplete}
              disabled={isLoading || item.status === "COMPLETED"}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{item.status === "COMPLETED" ? "Đã hoàn thành" : "Hoàn thành"}</span>
            </button>

            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                item.isActive
                  ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100"
                  : "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100"
              }`}
            >
              {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{item.isActive ? "Tạm dừng" : "Kích hoạt"}</span>
            </button>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        </div>

        {/* Delete Confirmation View */}
        {showDeleteConfirm ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-semibold text-base">Bạn có chắc muốn xóa lịch nhắc này?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Bạn có thể chọn chỉ hủy lượt nhắc hôm nay hoặc xóa hoàn toàn lịch trình này:
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDelete("THIS_OCCURRENCE")}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between"
              >
                <span>Chỉ xóa lượt nhắc lần này (Hôm nay)</span>
                <span className="text-xs text-slate-400">Giữ lịch cho các ngày sau</span>
              </button>
              <button
                onClick={() => handleDelete("ALL")}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-medium hover:bg-rose-100 text-left flex items-center justify-between"
              >
                <span>Xóa toàn bộ lịch lặp này</span>
                <span className="text-xs text-rose-500">Bảo lưu lịch sử đã làm</span>
              </button>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800"
            >
              Quay lại chỉnh sửa
            </button>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm border border-rose-200">
                {error}
              </div>
            )}

            {/* Phạm vi áp dụng */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-700/60">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Áp dụng thay đổi cho:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setScope("THIS_OCCURRENCE")}
                  className={`py-2 px-2 rounded-lg text-center transition-all ${
                    scope === "THIS_OCCURRENCE"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                  }`}
                >
                  Chỉ lần này
                </button>
                <button
                  type="button"
                  onClick={() => setScope("THIS_AND_FUTURE")}
                  className={`py-2 px-2 rounded-lg text-center transition-all ${
                    scope === "THIS_AND_FUTURE"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                  }`}
                >
                  Từ nay về sau
                </button>
                <button
                  type="button"
                  onClick={() => setScope("ALL")}
                  className={`py-2 px-2 rounded-lg text-center transition-all ${
                    scope === "ALL"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                  }`}
                >
                  Toàn bộ lịch
                </button>
              </div>
            </div>

            {/* Tên hoạt động */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Tên hoạt động
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Giờ nhắc & Thời lượng */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Giờ nhắc (HH:mm)
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WATER">💧 Uống nước</option>
                <option value="EXERCISE">🏋️ Tập thể dục</option>
                <option value="STUDY">📚 Học tập</option>
                <option value="WORK">💼 Công việc</option>
                <option value="HEALTH">🧘 Sức khỏe</option>
                <option value="OTHER">🎯 Khác</option>
              </select>
            </div>

            {/* Telegram toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Nhắc nhở Telegram
              </span>
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
