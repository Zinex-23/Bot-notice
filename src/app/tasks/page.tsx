"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Trash2,
  Clock,
  Send,
  Sparkles,
} from "lucide-react";
import { AddReminderModal } from "@/components/planner/AddReminderModal";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggle = async (taskId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/planner/${taskId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      loadTasks();
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Bạn có chắc muốn xóa vĩnh viễn công việc này?")) return;
    try {
      await fetch(`/api/planner/${taskId}?scope=ALL`, { method: "DELETE" });
      loadTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "ALL" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Công Việc</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Danh sách tất cả các hoạt động và lịch nhắc đã được lên lịch trong hệ thống.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm công việc</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 w-full sm:w-auto"
        >
          <option value="ALL">Tất cả danh mục</option>
          <option value="WATER">💧 Uống nước</option>
          <option value="EXERCISE">🏋️ Tập thể dục</option>
          <option value="STUDY">📚 Học tập</option>
          <option value="WORK">💼 Công việc</option>
          <option value="HEALTH">🧘 Sức khỏe</option>
          <option value="OTHER">🎯 Khác</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Đang tải danh sách...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Không tìm thấy công việc nào.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const schedule = t.schedules?.[0];

            return (
              <div
                key={t.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                      {t.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      {t.category}
                    </span>
                    {t.priority === "HIGH" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                        Ưu tiên cao
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="font-mono">
                      ⏰ {schedule?.startTime || "Chưa đặt giờ"}
                    </span>
                    {schedule?.durationMinutes > 0 && (
                      <span>• {schedule.durationMinutes} phút</span>
                    )}
                    <span>• Lặp: {schedule?.recurrenceType || "DAILY"}</span>
                    {t.telegramEnabled && (
                      <span className="text-blue-500 font-medium">• Telegram bật</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggle(t.id, t.isActive)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      t.isActive ? "bg-blue-600" : "bg-slate-300 dark:bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        t.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Xóa công việc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddReminderModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadTasks}
      />
    </div>
  );
}
